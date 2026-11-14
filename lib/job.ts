import { getJob, newId, updateJob, write } from "./db";
import { applyTurn, emptyInterview, nextTurn } from "./interview";
import { generateJson, type Part } from "./nemotron";
import { JOB_BRIEF, JOB_INTERVIEWER, JOB_WRITE } from "./prompts/tasks";
import { postingQuality, verifiedQuotes } from "./quality";
import { JobBriefSchema, PostingSchema, type Job } from "./types";

export const JOB_SECTION_LABELS: Record<string, string> = {
  role: "The role",
  essentials: "Essentials",
  day: "A real day",
  team: "Team",
  practical: "Practical",
};

export async function createJob(input: { company: string; title: string; text: string; images: string[] }) {
  const job: Job = {
    id: newId(),
    company: input.company.trim() || "My company",
    createdAt: new Date().toISOString(),
    status: "draft",
    draft: { title: input.title.trim(), text: input.text.trim() },
    interview: emptyInterview(),
    answers: [],
  };
  await write((db) => {
    db.jobs.unshift(job);
  });
  const parts: Part[] = [{ type: "text", text: `Company: ${job.company}\nTitle: ${job.draft.title || "(not given)"}\n\nDraft:\n${job.draft.text || "(no text, see images)"}` }];
  for (const url of input.images.slice(0, 3)) parts.push({ type: "image_url", image_url: { url } });
  const brief = await generateJson("Prepare hiring-manager interview", JobBriefSchema, JOB_BRIEF, parts);
  return updateJob(job.id, (j) => {
    j.brief = { listedSkills: brief.listedSkills, biasFlags: brief.biasFlags, questions: brief.questions.map((q, i) => ({ ...q, id: `q${i + 1}` })) };
  });
}

export async function jobInterviewTurn(id: string, answer: string | null) {
  let j = await getJob(id);
  if (!j?.brief) throw new Error("Interview not prepared");
  const now = new Date().toISOString();
  if (j.interview.turns.length === 0) {
    const first = j.brief.questions[0]?.question ?? "Why does this role exist?";
    return updateJob(id, (j) => {
      j.interview.turns.push({
        role: "agent",
        text: `Hi, a few quick questions about this job. ${first}`,
        at: now,
      });
    });
  }
  if (!answer?.trim()) return j;
  j = await updateJob(id, (j) => {
    j.interview.turns.push({ role: "candidate", text: answer.trim(), at: now });
  });
  const step = await nextTurn({
    task: "Interview turn (hiring manager)",
    system: JOB_INTERVIEWER,
    header: [`Company: ${j.company}`, `Draft title: ${j.draft.title}`, `Skills listed in the draft: ${j.brief!.listedSkills.join(", ") || "none"}`],
    questions: j.brief!.questions,
    state: j.interview,
    speaker: "Manager",
  });
  return updateJob(id, (j) => {
    applyTurn(j.interview, j.brief!.questions, step, "Done. Writing your job post now.", 14);
  });
}

export async function writePosting(id: string) {
  const job = await getJob(id);
  if (!job) throw new Error("Job not found");
  const transcript = job.interview.turns.map((t) => `${t.role === "agent" ? "Agent" : "Manager"}: ${t.text}`).join("\n");
  const user = [
    `Company: ${job.company}`,
    `Draft title: ${job.draft.title}`,
    `# Draft\n${job.draft.text}`,
    `# Conversation with the hiring manager\n${transcript || "(none)"}`,
    `# Facts noted\n${job.interview.facts.map((f) => `- ${f.text}`).join("\n") || "(none)"}`,
    `# Flagged phrases to rewrite\n${(job.brief?.biasFlags ?? []).map((b) => `- "${b.phrase}": ${b.suggestion}`).join("\n") || "(none)"}`,
  ].join("\n\n");
  const posting = await generateJson("Write job post", PostingSchema, JOB_WRITE, user, { maxTokens: 5000 });
  const spoken = job.interview.turns.filter((t) => t.role === "candidate").map((t) => t.text).join("\n");
  posting.managerWords = verifiedQuotes(posting.managerWords ?? [], spoken);
  const answers = job.interview.turns.filter((t) => t.role === "candidate").map((t) => ({ question: "", answer: t.text }));
  const quality = postingQuality(posting, { draft: job.draft, answers });
  return updateJob(id, (j) => {
    j.answers = answers;
    j.posting = posting;
    j.quality = quality;
  });
}
