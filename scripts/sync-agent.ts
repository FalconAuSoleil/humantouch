/**
 * Creates or updates the HumanTouch ElevenLabs agent and its screen tools.
 *
 *   npx tsx --env-file=.env.local scripts/sync-agent.ts
 *
 * Brain of the live conversation (AGENT_LLM):
 *   - "custom": our own OpenAI-compatible model (NVIDIA_BASE_URL + NEMOTRON_MODEL). Its API key is stored as an
 *     ElevenLabs workspace secret so the agent can call it.
 *   - any other value (default "gemini-2.5-flash"): a model hosted by ElevenLabs; no third-party key is shared.
 * Print the AGENT_ID it outputs into ELEVENLABS_AGENT_ID (.env.local and Vercel).
 */
import { agentConfig, eleven, SCREEN_TOOLS } from "../lib/voice-agent";

async function syncTools() {
  const { tools } = await eleven<{ tools: { id: string; tool_config: { name: string } }[] }>("/convai/tools");
  const ids: string[] = [];
  for (const tool of SCREEN_TOOLS) {
    const existing = tools.find((t) => t.tool_config.name === tool.name);
    if (existing) {
      await eleven(`/convai/tools/${existing.id}`, { method: "PATCH", body: { tool_config: tool } });
      ids.push(existing.id);
    } else {
      const created = await eleven<{ id: string }>("/convai/tools", { body: { tool_config: tool } });
      ids.push(created.id);
    }
    console.log(`tool ${tool.name} ok`);
  }
  return ids;
}

async function llmConfig(): Promise<Record<string, unknown>> {
  const mode = process.env.AGENT_LLM || "gemini-2.5-flash";
  if (mode !== "custom") return { llm: mode };
  const { secrets } = await eleven<{ secrets: { secret_id: string; name: string }[] }>("/convai/secrets");
  let secret = secrets.find((s) => s.name === "humantouch-llm-key");
  if (!secret) {
    secret = await eleven<{ secret_id: string; name: string }>("/convai/secrets", { body: { type: "new", name: "humantouch-llm-key", value: process.env.NVIDIA_API_KEY } });
  }
  return {
    llm: "custom-llm",
    custom_llm: { url: process.env.NVIDIA_BASE_URL, model_id: process.env.NEMOTRON_MODEL, api_key: { secret_id: secret.secret_id } },
  };
}

async function main() {
  const config = agentConfig(await syncTools(), await llmConfig());
  const id = process.env.ELEVENLABS_AGENT_ID;
  if (id) {
    await eleven(`/convai/agents/${id}`, { method: "PATCH", body: config });
    console.log(`agent ${id} updated`);
  } else {
    const created = await eleven<{ agent_id: string }>("/convai/agents/create", { body: config });
    console.log(`AGENT_ID=${created.agent_id}`);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
