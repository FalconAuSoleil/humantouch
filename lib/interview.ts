import { generateJson } from "./nemotron";
import { InterviewTurnSchema, type BriefQuestion, type InterviewState } from "./types";

// One engine for both voice agents (job seeker and hiring manager): note facts, track which prepared
// questions are covered, pick the next question or a follow-up. Code keeps "must" questions from being skipped.
export async function nextTurn(opts: {
  task: string;
  system: string;
  header: string[];
  questions: BriefQuestion[];
  state: InterviewState;
  speaker: string;
}) {
  const { state, questions } = opts;
  const agentTurns = state.turns.filter((t) => t.role === "agent").length;
  const user = [
    ...opts.header,
    `# Prepared questions`,
    ...questions.map((q) => `- ${q.id} [${q.priority}] (${q.topic}, ${q.expRef ?? "general"}) ${state.covered.includes(q.id) ? "COVERED" : "open"}: ${q.question}`),
    `# Facts noted so far`,
    ...state.facts.map((f) => `- ${f.text}`),
    `# Questions asked so far: ${agentTurns}`,
    `# Conversation (latest last)`,
    ...state.turns.slice(-12).map((t) => `${t.role === "agent" ? "Agent" : opts.speaker}: ${t.text}`),
  ].join("\n");
  const turn = await generateJson(opts.task, InterviewTurnSchema, opts.system, user, { temperature: 0.3, maxTokens: 1200, fast: true });
  return { turn, agentTurns };
}

// Belt and braces: drop the filler a model may still put before the question.
const FILLER = /^(?:(?:got it|okay|ok|thanks|thank you|great|perfect|noted|understood|alright|right|sure|nice|good|i see)[.,!:]?\s+)+/i;
export const toThePoint = (q: string) => {
  const t = q.trim().replace(FILLER, "");
  return t.charAt(0).toUpperCase() + t.slice(1);
};

export function applyTurn(
  state: InterviewState,
  questions: BriefQuestion[],
  { turn, agentTurns }: Awaited<ReturnType<typeof nextTurn>>,
  closing: string,
  maxQuestions = 16,
) {
  state.facts.push(...turn.facts);
  for (const id of turn.coveredQuestionIds) if (!state.covered.includes(id)) state.covered.push(id);
  const mustLeft = questions.some((q) => q.priority !== "medium" && !state.covered.includes(q.id));
  const finished = (turn.done && !mustLeft) || !turn.nextQuestion || agentTurns >= maxQuestions;
  state.done = finished;
  state.turns.push({ role: "agent", text: finished ? closing : toThePoint(turn.nextQuestion!), at: new Date().toISOString() });
}

export const emptyInterview = (): InterviewState => ({ turns: [], facts: [], covered: [], done: false });
