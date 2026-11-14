import { AGENT_FIRST_MESSAGE, AGENT_SYSTEM } from "./prompts/voice";

// ElevenLabs Agents (realtime voice): streaming audio, turn detection, TTS and STT run on ElevenLabs.
// The API key stays on the server; the browser gets a short-lived signed URL.
const API = "https://api.elevenlabs.io/v1";

export function elevenKey() {
  const k = process.env.ELEVENLABS_API_KEY;
  if (!k) throw new Error("ELEVENLABS_API_KEY is not set");
  return k;
}

export async function eleven<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: init.method ?? (init.body ? "POST" : "GET"),
    headers: { "xi-api-key": elevenKey(), "content-type": "application/json" },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`ElevenLabs ${path} ${res.status}: ${text.slice(0, 400)}`);
  return (text ? JSON.parse(text) : {}) as T;
}

/** Client tools: the agent updates the screen through them instead of saying things out loud. */
export const SCREEN_TOOLS = [
  {
    type: "client",
    name: "note_fact",
    description: "Shows on screen a fact you just understood. Call it after each answer that brings a useful fact, instead of repeating it out loud.",
    parameters: {
      type: "object",
      required: ["fact"],
      properties: {
        fact: { type: "string", description: "The fact in one short sentence, with the person's exact words and numbers." },
        point: { type: "string", enum: ["number", "team", "contribution", "other"], description: "number: a measured result; team: team size or roles; contribution: what the person did themselves; other." },
      },
    },
    expects_response: false,
  },
  {
    type: "client",
    name: "mark_covered",
    description: "Marks a prepared question as answered, so the progress bar moves. Call it with the question id as soon as it is answered.",
    parameters: { type: "object", required: ["question_id"], properties: { question_id: { type: "string", description: "The id of the prepared question, like q3." } } },
    expects_response: false,
  },
  {
    type: "client",
    name: "end_interview",
    description: "Ends the interview once every must and high question is covered, right after your closing sentence.",
    parameters: { type: "object", properties: { reason: { type: "string", description: "Why the interview ends." } } },
    expects_response: false,
  },
];

/** Acknowledgements people say while the agent talks; they must not cut it off. */
export const BACKCHANNELS = ["yes", "yeah", "yep", "ok", "okay", "right", "sure", "mm", "mhm", "hmm", "uh", "um", "exactly", "i see", "got it", "yes yes", "ok ok", "true"];

/**
 * Same turn-taking as Smart Portfolio: an interview, not a support call. The agent waits for a real end of
 * turn, gives 10 seconds before re-engaging, ignores backchannels and retries a turn it heard as silent.
 */
export const INTERVIEW_TURN = {
  turn_eagerness: "patient",
  turn_timeout: 10,
  interruption_ignore_terms: BACKCHANNELS,
  interruption_ignore_term_languages: ["en"],
  merge_with_default_ignore_terms: true,
  retranscribe_on_turn_timeout: true,
};

export function agentConfig(toolIds: string[], llm: Record<string, unknown>) {
  return {
    name: "HumanTouch interviewer",
    tags: ["humantouch"],
    conversation_config: {
      agent: {
        first_message: AGENT_FIRST_MESSAGE,
        language: "en",
        prompt: { prompt: AGENT_SYSTEM, tool_ids: toolIds, temperature: 0.4, ...llm },
      },
      tts: { voice_id: process.env.ELEVENLABS_VOICE_ID || "JBFqnCBsd6RMkjVDRZzb", model_id: "eleven_flash_v2" },
      turn: INTERVIEW_TURN,
      conversation: { max_duration_seconds: 2 * 60 * 60 },
    },
  };
}

export async function signedUrl() {
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!agentId) throw new Error("ELEVENLABS_AGENT_ID is not set");
  const r = await eleven<{ signed_url: string }>(`/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`);
  return r.signed_url;
}
