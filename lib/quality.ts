import type { Job, Passport, Posting, QualityCheck, QualityReport } from "./types";
import { JOB_RULES } from "./prompts/guide-job";

const WEAK_OPENERS = /^(was responsible|responsible for|participated|contributed|helped|assisted|in charge of|involved in|worked on)/i;

const numbersIn = (s: string) => s.match(/\d+(?:[.,]\d+)?/g) ?? [];
const hasNumber = (s: string) => /\d/.test(s);
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

function normalizeNumber(n: string) {
  return n.replace(",", ".").replace(/\.0+$/, "");
}

/** Every number written in the passport must exist in the sources or the transcript. */
export function ungroundedNumbers(text: string, evidence: string): string[] {
  const known = new Set(numbersIn(evidence.replace(/(\d)[ ,](?=\d{3}\b)/g, "$1")).map(normalizeNumber));
  const out = new Set<string>();
  for (const n of numbersIn(text.replace(/(\d)[ ,](?=\d{3}\b)/g, "$1"))) {
    if (/^(19|20)\d\d$/.test(n)) continue; // years
    if (!known.has(normalizeNumber(n))) out.add(n);
  }
  return [...out];
}

export function passportText(p: Passport) {
  return [
    p.headline,
    p.summary,
    ...p.topSkills,
    ...p.transferableSkills.map((t) => `${t.skill}: ${t.proof}`),
    ...p.experiences.flatMap((e) => [e.title, e.organization, e.context, ...e.achievements, ...e.results]),
    ...p.projects,
  ].join("\n");
}

export function passportQuality(p: Passport, evidence: string | null): QualityReport {
  const recent = p.experiences.filter((e) => e.kind !== "career-break").slice(0, 2);
  const bullets = recent.flatMap((e) => [...e.achievements, ...e.results]);
  const checks: QualityCheck[] = [
    { id: "headline", label: "Headline uses a market job title", ok: words(p.headline) <= 6 && !/consultant$/i.test(p.headline) },
    { id: "skills", label: "3 master skills, readable in 30 seconds", ok: p.topSkills.length === 3 },
    {
      id: "context",
      label: "Recent experiences explain the context and stake",
      ok: recent.length > 0 && recent.every((e) => words(e.context) >= 20),
    },
    { id: "scale", label: "Each recent experience gives its scale in numbers", ok: recent.length > 0 && recent.every((e) => hasNumber(e.context)) },
    {
      id: "result",
      label: "Each recent experience has a measured result or named deliverable",
      ok: recent.length > 0 && recent.every((e) => e.results.length > 0 && e.results.some(hasNumber)),
    },
    {
      id: "verbs",
      label: "Bullets open with precise action verbs",
      ok: bullets.every((b) => !WEAK_OPENERS.test(b)),
      detail: bullets.filter((b) => WEAK_OPENERS.test(b)).slice(0, 2).join(" / ") || undefined,
    },
    { id: "short", label: "Short bullets, one idea each", ok: bullets.every((b) => words(b) <= 26) },
    { id: "transferable", label: "Transferable skills are made visible", ok: p.transferableSkills.length >= 2 },
  ];
  const ungrounded = evidence === null ? [] : ungroundedNumbers(passportText(p), evidence);
  checks.push({
    id: "grounded",
    label: "Every number is backed by the CV, LinkedIn or interview",
    ok: ungrounded.length === 0,
    detail: ungrounded.length ? `Not found in sources: ${ungrounded.join(", ")}` : undefined,
  });
  const score = Math.round((100 * checks.filter((c) => c.ok).length) / checks.length);
  return { score, checks, ungroundedNumbers: ungrounded };
}

const BIASED = /\b(young|digital native|rockstar|ninja|guru|aggressive|native (english|finnish) speaker|culture fit|energetic|recent graduate)\b/i;

/** Deterministic checks of the final posting against the golden rules. */
export function postingQuality(p: Posting, job: Pick<Job, "draft" | "answers">): QualityReport {
  const all = JSON.stringify(p);
  const words = (x: string) => x.trim().split(/\s+/).filter(Boolean).length;
  const total = words([p.summary, ...p.outcomes, ...p.mustHave.map((m) => `${m.skill} ${m.evidence}`), ...p.niceToHave.map((n) => n.skill), p.team, ...p.aDay, ...p.challenges, p.growth ?? "", ...p.process, p.inclusionStatement].join(" "));
  const ok: Record<string, boolean> = {
    R1: words(p.title) <= 6 && !/ninja|rockstar|guru|wizard/i.test(p.title) && p.level.length > 0,
    R2: words(p.summary) >= 15,
    R3: p.outcomes.length >= 2,
    R4: p.mustHave.length >= 1 && p.mustHave.length <= 5,
    R5: !/\b\d+\+?\s*years?\b/i.test(p.mustHave.map((m) => m.skill).join(" ")) && !/degree|master'?s|bachelor/i.test(p.mustHave.map((m) => m.skill).join(" ")),
    R6: p.aDay.length >= 2,
    R7: p.challenges.length >= 1,
    R8: words(p.team) >= 5,
    R9: Boolean(p.salary && hasNumber(p.salary)),
    R10: p.location.length > 0 && p.remote.length > 0,
    R11: p.workingLanguage.length > 0 && p.languageNote.length > 0,
    R12: Boolean(p.growth) || Boolean(p.relocationSupport),
    R13: p.process.length >= 2,
    R14: !BIASED.test(all) && total <= 450,
    R15: p.managerWords.length > 0,
  };

  const evidence = `${job.draft.title}\n${job.draft.text}\n${job.answers.map((a) => a.answer).join("\n")}`;
  const ungrounded = ungroundedNumbers(
    [p.summary, ...p.outcomes, p.team, p.salary ?? "", p.relocationSupport ?? "", ...p.process].join("\n"),
    evidence,
  );
  const checks: QualityCheck[] = JOB_RULES.map((r) => ({ id: r.id, label: r.label, ok: ok[r.id] }));
  checks.push({
    id: "grounded",
    label: "No number invented by the AI",
    ok: ungrounded.length === 0,
    detail: ungrounded.length ? `Check: ${ungrounded.join(", ")}` : undefined,
  });
  return { score: Math.round((100 * checks.filter((c) => c.ok).length) / checks.length), checks, ungroundedNumbers: ungrounded };
}

const squash = (s: string) => s.toLowerCase().replace(/[\u2018\u2019]/g, "'").replace(/[^\p{L}\p{N}%']+/gu, " ").trim();

/** Keeps only the quotes that really appear in what the person said: their voice, not the model's. */
export function verifiedQuotes(quotes: string[], spoken: string) {
  const hay = squash(spoken);
  return quotes.map((q) => q.trim().replace(/^["“]|["”]$/g, "")).filter((q) => q.split(/\s+/).length >= 4 && hay.includes(squash(q)));
}
