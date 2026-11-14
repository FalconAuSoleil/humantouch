import { openingLine } from "./candidate";
import { VOICE_EMPLOYER, VOICE_SEEKER } from "./prompts/voice";
import type { BriefQuestion, Candidate, Job } from "./types";

const questionList = (qs: BriefQuestion[]) => qs.map((q) => `${q.id} [${q.priority}] ${q.question}`).join("\n");

/** Dynamic variables for one realtime session: who we talk to, what we know, what to ask. */
export function candidateVariables(c: Candidate) {
  const b = c.brief!;
  return {
    instructions: VOICE_SEEKER,
    context: [
      `Name: ${c.firstName}`,
      `Positioning: ${b.positioning}`,
      `Experiences: ${(c.profile?.experiences ?? []).map((e) => `${e.ref}=${e.title} at ${e.client || e.organization}`).join("; ") || "none known: ask for their last two experiences first"}`,
      `Already in the CV (confirm, do not ask): ${b.alreadyKnown.join(" | ") || "nothing"}`,
    ].join("\n"),
    questions: questionList(b.questions),
    first_message: openingLine(c),
  };
}

export function jobVariables(j: Job) {
  const b = j.brief!;
  return {
    instructions: VOICE_EMPLOYER,
    context: [`Company: ${j.company}`, `Draft title: ${j.draft.title}`, `Skills listed in the draft: ${b.listedSkills.join(", ") || "none"}`, `Draft: ${j.draft.text.slice(0, 1500)}`].join("\n"),
    questions: questionList(b.questions),
    first_message: `Hi, a few quick questions about this job. ${b.questions[0]?.question ?? "Why does this role exist?"}`,
  };
}
