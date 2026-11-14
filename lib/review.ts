import { generateJson } from "./nemotron";
import { FIT_CHECK } from "./prompts/tasks";
import { FitCheckSchema, type Application, type Candidate, type Job, type LogEntry, type Passport, type ReqCheck } from "./types";

// Human in the loop (EU AI Act, recruitment = high risk): the AI only suggests evidence checks when the
// recruiter asks; the recruiter confirms each line, the score is computed from the recruiter's choices,
// every decision needs a human click (and a reason when it is "not now"), and everything is logged.

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}%]+/gu, " ").trim();

/** What the AI sees: skills and evidence only. No name, no location, no school. */
export function blindPassport(p: Passport) {
  return [
    `Target role: ${p.headline}`,
    `Summary: ${p.summary}`,
    `Skills: ${[...p.topSkills, ...p.technicalSkills, ...p.functionalSkills].join(", ")}`,
    `Tools: ${p.tools.join(", ")}`,
    ...p.transferableSkills.map((t) => `Transferable: ${t.skill}: ${t.proof}`),
    ...p.experiences.map((e) => `Experience: ${e.title}${e.sector ? ` (${e.sector})` : ""}\n${e.context}\n${[...e.achievements, ...e.results].map((b) => `- ${b}`).join("\n")}\nTools: ${e.tools.join(", ")}`),
    `Languages: ${p.languages.map((l) => `${l.name} ${l.level}`).join(", ")}`,
    `Certifications: ${p.certifications.join(", ")}`,
    ...p.projects.map((x) => `Project: ${x}`),
  ].join("\n");
}

export function requirementsOf(j: Job): ReqCheck[] {
  return [
    ...(j.posting?.mustHave ?? []).map((m) => ({ skill: m.skill, kind: "must" as const, status: "missing" as const, evidence: "" })),
    ...(j.posting?.niceToHave ?? []).map((m) => ({ skill: m.skill, kind: "nice" as const, status: "missing" as const, evidence: "" })),
  ];
}

/** The score is the recruiter's: must-haves weigh twice, partial evidence counts half. */
export function scoreOf(checks: ReqCheck[]) {
  let got = 0, max = 0;
  for (const c of checks) {
    const w = c.kind === "must" ? 2 : 1;
    max += w;
    got += w * (c.status === "met" ? 1 : c.status === "partial" ? 0.5 : 0);
  }
  return max ? Math.round((100 * got) / max) : null;
}

export const logEntry = (actor: LogEntry["actor"], action: string, detail?: string): LogEntry => ({ at: new Date().toISOString(), actor, action, detail });

export async function suggestFit(c: Candidate, j: Job): Promise<ReqCheck[]> {
  const blind = blindPassport(c.passport!);
  const posting = j.posting!;
  const user = `# Job\n${posting.title} (${posting.level})\nMust-haves (write the skill exactly as given):\n${posting.mustHave.map((m) => `- ${m.skill}\n  what counts as proof: ${m.evidence}`).join("\n")}\nNice-to-haves:\n${posting.niceToHave.map((m) => `- ${m.skill}`).join("\n")}\n\n# Anonymised Skills Passport\n${blind}`;
  const out = await generateJson("Evidence pre-check (for the recruiter)", FitCheckSchema, FIT_CHECK, user, { temperature: 0.1, maxTokens: 2500 });
  const hay = norm(blind);
  // Answers are mapped back to the job's own requirement names (the model sometimes adds words).
  return requirementsOf(j).map((req, i) => {
    const r = out.requirements.find((o) => norm(o.skill).startsWith(norm(req.skill)) || norm(req.skill).startsWith(norm(o.skill))) ?? out.requirements[i];
    if (!r) return req;
    // A claimed proof must be a real quote of the passport, otherwise it is downgraded.
    const grounded = r.evidence.trim().length > 0 && hay.includes(norm(r.evidence));
    return { skill: req.skill, kind: req.kind, status: r.status === "met" && !grounded ? "partial" : r.status, evidence: grounded ? r.evidence : "", grounded };
  });
}

export const SLOTS = ["Espoo Talent Day, Fri 21 Nov, 10:00", "Espoo Talent Day, Fri 21 Nov, 11:30", "Espoo Talent Day, Fri 21 Nov, 14:00", "Online, Mon 24 Nov, 15:00"];

export function applyReview(a: Application, input: { checks: ReqCheck[]; decision?: Application["decision"]; reason?: string }) {
  // Validate before touching anything: a refused decision must leave the application unchanged.
  if (input.decision === "not_now" && !input.reason?.trim()) throw new Error("A reason is required");
  a.checks = input.checks.map((c) => ({ skill: c.skill, kind: c.kind, status: c.status, evidence: c.evidence ?? "" }));
  a.score = scoreOf(a.checks);
  a.log = [...(a.log ?? []), logEntry("recruiter", "Assessed the evidence", `Score ${a.score ?? "–"}`)];
  if (input.decision) {
    a.decision = input.decision;
    a.reason = input.reason?.trim() || undefined;
    if (input.decision === "invite") {
      a.status = a.initiatedBy === "candidate" ? "accepted" : "invited";
      a.slot ??= SLOTS[Math.abs([...a.id].reduce((h, ch) => h + ch.charCodeAt(0), 0)) % SLOTS.length];
    }
    if (input.decision === "not_now") a.status = "declined";
    a.log.push(logEntry("recruiter", input.decision === "invite" ? "Invited to talk" : input.decision === "shortlist" ? "Shortlisted" : "Not now", a.reason));
  }
  return a;
}
