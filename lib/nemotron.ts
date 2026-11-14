import { spawn } from "child_process";
import os from "os";
import { z } from "zod";
import { logAiCall } from "./db";

// NVIDIA Build is OpenAI-compatible. We call it with fetch so every request is visible and
// we control retries (free tier ~40 rpm), thinking mode and the JSON repair loop.
const BASE = process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";
export const MODEL = process.env.NEMOTRON_MODEL || "nvidia/nemotron-3.5-super-vl-120b-a12b";

export type Part = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };
export type Msg = { role: "system" | "user" | "assistant"; content: string | Part[] };

export function hasNvidiaKey() {
  return Boolean(process.env.NVIDIA_API_KEY);
}

/** Temporary stand-in while the NVIDIA key is missing: the local `claude -p` CLI (text only). */
export function provider(): "nemotron" | "claude-cli" | "none" {
  if (hasNvidiaKey()) return "nemotron";
  // The claude CLI only exists on a dev machine, never on Vercel.
  return process.env.LLM_FALLBACK === "off" || process.env.VERCEL ? "none" : "claude-cli";
}

export function canGenerate() {
  return provider() !== "none";
}

export class AiError extends Error {}

function flatten(messages: Msg[]) {
  return messages
    .map((m) => {
      const text = typeof m.content === "string" ? m.content : m.content.map((p) => (p.type === "text" ? p.text : "[page image omitted]")).join("\n");
      return m.role === "system" ? text : `### ${m.role.toUpperCase()}\n${text}`;
    })
    .join("\n\n");
}

function claudeCli(messages: Msg[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("claude", ["-p", "--output-format", "text", "--model", process.env.CLAUDE_CLI_MODEL || "sonnet"], {
      cwd: os.tmpdir(),
      env: process.env,
    });
    let out = "";
    let err = "";
    const timer = setTimeout(() => child.kill("SIGKILL"), 240_000);
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("error", (e) => reject(new AiError(`claude CLI failed: ${e.message}`)));
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(out.trim());
      else reject(new AiError(`claude CLI exited ${code}: ${err.slice(0, 300)}`));
    });
    child.stdin.end(`${flatten(messages)}\n\nAnswer now. Do not use any tool.`);
  });
}

async function post(path: string, body: unknown): Promise<Response> {
  if (!hasNvidiaKey()) throw new AiError("AI is not configured on this deployment yet (NVIDIA_API_KEY missing). Demo profiles and jobs still work.");
  let last = "";
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(150_000),
    });
    if (res.ok) return res;
    last = `${res.status} ${(await res.text()).slice(0, 300)}`;
    if (res.status === 429 || res.status >= 500) {
      await new Promise((r) => setTimeout(r, 1500 * 2 ** attempt));
      continue;
    }
    throw new AiError(`Nemotron request failed: ${last}`);
  }
  throw new AiError(`Nemotron unavailable after retries: ${last}`);
}

function stripThinking(text: string) {
  return text.replace(/<think>[\s\S]*?<\/think>/g, "").replace(/^[\s\S]*<\/think>/, "").trim();
}

let thinkingFlagSupported = true;

export async function chat(messages: Msg[], opts: { temperature?: number; maxTokens?: number; fast?: boolean } = {}) {
  if (provider() === "claude-cli") return stripThinking(await claudeCli(messages));
  const body: Record<string, unknown> = {
    model: MODEL,
    messages,
    temperature: opts.temperature ?? 0.2,
    top_p: 0.95,
    max_tokens: Math.max(opts.maxTokens ?? 4096, 6000), // reasoning models spend part of it thinking
  };
  if (thinkingFlagSupported) body.chat_template_kwargs = { enable_thinking: false };
  // Optional reasoning budget: none for live interview turns (voice latency), a little for writing.
  const effort = opts.fast ? process.env.LLM_REASONING_FAST : process.env.LLM_REASONING;
  if (effort) body.reasoning_effort = effort;
  let res: Response;
  try {
    res = await post("/chat/completions", body);
  } catch (e) {
    if (thinkingFlagSupported && e instanceof AiError && /failed: 4(00|22)/.test(e.message)) {
      thinkingFlagSupported = false;
      delete body.chat_template_kwargs;
      delete body.reasoning_effort;
      res = await post("/chat/completions", body);
    } else throw e;
  }
  const json = await res.json();
  return stripThinking(json.choices?.[0]?.message?.content ?? "");
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("No JSON object in the answer");
  return JSON.parse(raw.slice(start, end + 1));
}

function hasImages(content: string | Part[]) {
  return Array.isArray(content) && content.some((p) => p.type === "image_url");
}

/**
 * Structured generation with a self-repair loop: the zod schema is given to Nemotron as a
 * JSON Schema, the answer is validated, and validation errors are sent back for correction.
 */
export async function generateJson<T>(
  task: string,
  schema: z.ZodType<T>,
  system: string,
  user: string | Part[],
  opts: { temperature?: number; maxTokens?: number; fast?: boolean } = {},
): Promise<T> {
  const jsonSchema = JSON.stringify(z.toJSONSchema(schema, { io: "input" }));
  const messages: Msg[] = [
    {
      role: "system",
      content: `${system}\n\n# Output format\nAnswer with ONE JSON object only, no prose, no markdown fence. It must validate against this JSON Schema:\n${jsonSchema}`,
    },
    { role: "user", content: user },
  ];
  const started = Date.now();
  let lastError = "";
  for (let attempt = 1; attempt <= 3; attempt++) {
    let text: string;
    try {
      text = await chat(messages, opts);
    } catch (e) {
      // A vision payload the endpoint refuses should not kill the flow: retry on text only.
      if (attempt === 1 && hasImages(messages[1].content) && provider() === "nemotron") {
        const parts = messages[1].content as Part[];
        messages[1] = { role: "user", content: parts.filter((p) => p.type === "text") };
        lastError = (e as Error).message;
        continue;
      }
      await logAiCall({ task, ms: Date.now() - started, attempts: attempt, ok: false, error: (e as Error).message, provider: provider() });
      throw e;
    }
    try {
      const parsed = schema.safeParse(extractJson(text));
      if (parsed.success) {
        await logAiCall({ task, ms: Date.now() - started, attempts: attempt, ok: true, vision: hasImages(messages[1].content) && provider() === "nemotron", provider: provider() });
        return parsed.data;
      }
      lastError = parsed.error.issues
        .slice(0, 8)
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
    } catch (e) {
      lastError = (e as Error).message;
    }
    messages.push({ role: "assistant", content: text });
    messages.push({
      role: "user",
      content: `Your JSON did not validate: ${lastError}. Return the complete corrected JSON object only.`,
    });
  }
  await logAiCall({ task, ms: Date.now() - started, attempts: 3, ok: false, error: lastError, provider: provider() });
  throw new AiError(`Nemotron returned invalid output for ${task}: ${lastError}`);
}
