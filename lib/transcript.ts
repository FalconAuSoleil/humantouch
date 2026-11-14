import type { Fact, InterviewState, Turn } from "./types";

/** Keeps a realtime transcript sent by the browser, bounded and typed. */
export function cleanTranscript(body: { turns?: Turn[]; facts?: Fact[]; covered?: string[] }): InterviewState {
  const turns = (body.turns ?? [])
    .filter((t) => (t.role === "agent" || t.role === "candidate") && typeof t.text === "string" && t.text.trim())
    .slice(0, 200)
    .map((t) => ({ role: t.role, text: t.text.slice(0, 2000), at: t.at || new Date().toISOString() }));
  const facts = (body.facts ?? []).filter((f) => typeof f.text === "string").slice(0, 100).map((f) => ({ text: f.text.slice(0, 300), point: f.point ?? "other", expRef: f.expRef ?? null }));
  return { turns, facts, covered: (body.covered ?? []).filter((x) => typeof x === "string").slice(0, 50), done: true };
}
