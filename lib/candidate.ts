import { getCandidate, updateCandidate } from "./db";
import { generateJson, type Part } from "./nemotron";
import { BRIEF, EXTRACTION, INTERVIEWER, PASSPORT } from "./prompts/tasks";
import { applyTurn, emptyInterview, nextTurn } from "./interview";
import { passportQuality, verifiedQuotes } from "./quality";
import { BriefSchema, PassportSchema, ProfileSchema, type Candidate } from "./types";

export type UploadedDoc = { kind: "cv" | "linkedin"; name: string; text: string; images: string[] };

// Contact details never reach the model nor the database (privacy by design).
export function maskContacts(text: string) {
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[email]")
    .replace(/(\+?\d[\d ().-]{7,}\d)/g, (m) => (m.replace(/\D/g, "").length >= 9 ? "[phone]" : m))
    .replace(/https?:\/\/\S+|linkedin\.com\/\S+/gi, "[link]");
}

function sourcesBlock(c: Candidate) {
  return c.sources.map((s) => `## Document "${s.kind}" (${s.name})\n${s.text.slice(0, 18000)}`).join("\n\n");
}

export async function extractProfile(id: string, docs: UploadedDoc[]) {
  const sources = docs.map((d) => ({ kind: d.kind, name: d.name, text: maskContacts(d.text) }));
  const c = await updateCandidate(id, (c) => {
    c.sources = sources;
  });
  const parts: Part[] = [{ type: "text", text: sourcesBlock(c) || "No documents: return an empty profile." }];
  for (const d of docs) {
    for (const url of d.images.slice(0, 2)) {
      parts.push({ type: "text", text: `Page image of document "${d.kind}":` });
      parts.push({ type: "image_url", image_url: { url } });
    }
  }
  const profile = await generateJson("Read CV & LinkedIn (vision)", ProfileSchema, EXTRACTION, parts, { maxTokens: 6000 });
  return updateCandidate(id, (c) => {
    c.profile = profile;
    c.status = "extracted";
  });
}

export async function prepareBrief(id: string) {
  const c = await getCandidate(id);
  if (!c) throw new Error("Candidate not found");
  const user = `# Extracted profile\n${JSON.stringify(c.profile ?? {}, null, 1)}\n\n# Full sources\n${sourcesBlock(c) || "(none: the person has no CV yet, start from their story: ask for their last 2 experiences)"}`;
  const brief = await generateJson("Prepare interview (golden rules)", BriefSchema, BRIEF, user);
  return updateCandidate(id, (c) => {
    c.brief = { ...brief, questions: brief.questions.map((q, i) => ({ ...q, id: `q${i + 1}` })) };
    c.status = "interview";
    c.interview = emptyInterview();
  });
}

export function openingLine(c: Candidate) {
  const first = c.brief?.questions[0]?.question ?? "What job do you want next?";
  return `Hi ${c.firstName}, a few questions to add your own words to your CV. ${first}`;
}

export async function interviewTurn(id: string, answer: string | null) {
  let c = await getCandidate(id);
  if (!c?.brief) throw new Error("Interview not prepared");
  const now = new Date().toISOString();

  if (c.interview.turns.length === 0) {
    const text = openingLine(c);
    return updateCandidate(id, (c) => {
      c.interview.turns.push({ role: "agent", text, at: now });
    });
  }
  if (!answer?.trim()) return c;

  c = await updateCandidate(id, (c) => {
    c.interview.turns.push({ role: "candidate", text: answer.trim(), at: now });
  });
  const brief = c.brief!;
  const step = await nextTurn({
    task: "Interview turn (job seeker)",
    system: INTERVIEWER,
    header: [
      `Candidate first name: ${c.firstName}`,
      `Positioning: ${brief.positioning}`,
      `Experiences: ${(c.profile?.experiences ?? []).map((e) => `${e.ref}=${e.title} at ${e.organization}`).join("; ") || "none known"}`,
    ],
    questions: brief.questions,
    state: c.interview,
    speaker: c.firstName,
  });
  return updateCandidate(id, (c) => {
    applyTurn(c.interview, c.brief!.questions, step, "Done. Writing your passport now.");
  });
}

export async function writePassport(id: string) {
  const c = await getCandidate(id);
  if (!c) throw new Error("Candidate not found");
  const transcript = c.interview.turns.map((t) => `${t.role === "agent" ? "Interviewer" : c.firstName}: ${t.text}`).join("\n");
  const user = [
    `# Extracted profile\n${JSON.stringify(c.profile ?? {}, null, 1)}`,
    `# Full sources\n${sourcesBlock(c) || "(none)"}`,
    `# Interview transcript\n${transcript || "(no interview)"}`,
    `# Facts noted during the interview\n${c.interview.facts.map((f) => `- ${f.text}`).join("\n") || "(none)"}`,
  ].join("\n\n");
  const passport = await generateJson("Write Skills Passport", PassportSchema, PASSPORT, user, { maxTokens: 7000 });
  const evidence = `${c.sources.map((s) => s.text).join("\n")}\n${transcript}\n${c.interview.facts.map((f) => f.text).join("\n")}`;
  const spoken = c.interview.turns.filter((t) => t.role === "candidate").map((t) => t.text).join("\n");
  passport.ownWords = verifiedQuotes(passport.ownWords ?? [], spoken);
  const quality = passportQuality(passport, evidence);
  for (const n of quality.ungroundedNumbers) passport.toVerify.push(`Confirm the number "${n}": it is not in your CV nor in the interview`);
  return updateCandidate(id, (c) => {
    c.passport = passport;
    c.quality = quality;
    c.status = "passport";
  });
}
