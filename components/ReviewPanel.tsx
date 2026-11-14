"use client";
import { useState } from "react";
import { Bot, CalendarPlus, Check, CircleDashed, Minus, Quote, Sparkles, Star, UserRound, X } from "lucide-react";
import { api } from "./api";
import { saveSnapshot, snapshot } from "./snapshot";
import { Badge, Button, Details, cx } from "./ui";
import type { Application, Job, ReqCheck } from "@/lib/types";

// Human in the loop: the AI suggests, the recruiter confirms each line, the score is the recruiter's,
// and every decision is a human click (with a reason for "not now"), logged and visible to the candidate.

const STATUSES: { v: ReqCheck["status"]; icon: typeof Check; label: string; on: string }[] = [
  { v: "met", icon: Check, label: "Proven", on: "bg-emerald-600 text-white border-emerald-600" },
  { v: "partial", icon: CircleDashed, label: "Partly", on: "bg-amber-500 text-white border-amber-500" },
  { v: "missing", icon: Minus, label: "Not yet", on: "bg-slate-500 text-white border-slate-500" },
];

const REASONS = ["A must-have is not shown yet", "Another profile is closer for now", "Availability does not match"];

export function requirementsOf(job: Job): ReqCheck[] {
  return [
    ...(job.posting?.mustHave ?? []).map((m) => ({ skill: m.skill, kind: "must" as const, status: "missing" as const, evidence: "" })),
    ...(job.posting?.niceToHave ?? []).map((m) => ({ skill: m.skill, kind: "nice" as const, status: "missing" as const, evidence: "" })),
  ];
}

export function scoreOf(checks: ReqCheck[]) {
  let got = 0, max = 0;
  for (const c of checks) {
    const w = c.kind === "must" ? 2 : 1;
    max += w;
    got += w * (c.status === "met" ? 1 : c.status === "partial" ? 0.5 : 0);
  }
  return max ? Math.round((100 * got) / max) : 0;
}

export function ReviewPanel({ application, job, onChange }: { application: Application; job: Job; onChange: (a: Application) => void }) {
  const base = requirementsOf(job);
  const initial = base.map((r) => application.checks?.find((c) => c.skill === r.skill) ?? { ...r, status: undefined as unknown as ReqCheck["status"] });
  const [checks, setChecks] = useState<(ReqCheck & { status?: ReqCheck["status"] })[]>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [askReason, setAskReason] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ai = (skill: string) => application.aiCheck?.find((c) => c.skill === skill);
  const decided = checks.every((c) => c.status);
  const score = scoreOf(checks.map((c) => ({ ...c, status: c.status ?? "missing" })));

  const save = (a: Application) => {
    saveSnapshot("a", a);
    onChange(a);
  };

  const suggest = async () => {
    setBusy("ai");
    setError(null);
    try {
      const a = await api<Application>(`/api/applications/${application.id}/suggest`, {
        application: snapshot("a", application.id) ?? application, candidate: snapshot("c", application.candidateId), job: snapshot("j", job.id) ?? job,
      });
      save(a);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const acceptAll = () => setChecks((cs) => cs.map((c) => ({ ...c, status: ai(c.skill)?.status ?? c.status, evidence: ai(c.skill)?.evidence ?? c.evidence })));

  const decide = async (decision?: Application["decision"]) => {
    if (decision === "not_now" && !reason.trim()) {
      setAskReason(true);
      return;
    }
    setBusy(decision ?? "save");
    setError(null);
    try {
      const a = await api<Application>(`/api/applications/${application.id}/review`, {
        checks: checks.map((c) => ({ ...c, status: c.status ?? "missing" })), decision, reason, application: snapshot("a", application.id) ?? application,
      });
      save(a);
      setAskReason(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-line bg-soft/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-12 flex-col items-center justify-center rounded-2xl bg-white text-emp ring-1 ring-line">
            <span className="text-lg font-extrabold leading-none">{decided ? score : "–"}</span>
            <span className="text-[9px] font-bold uppercase">score</span>
          </span>
          <div>
            <p className="flex items-center gap-1 text-sm font-bold text-ink"><UserRound className="size-4" /> Your assessment</p>
            <p className="text-xs text-muted">The score comes from your choices, not from the AI.</p>
          </div>
        </div>
        {!application.aiCheck ? (
          <Button side="emp" variant="outline" size="sm" onClick={suggest} loading={busy === "ai"}><Sparkles className="size-4" /> Ask AI to pre-check the evidence</Button>
        ) : (
          <button onClick={acceptAll} className="flex items-center gap-1 text-xs font-semibold text-emp hover:underline"><Bot className="size-3.5" /> Use the AI suggestions as a start</button>
        )}
      </div>

      <ul className="space-y-2">
        {checks.map((c, i) => {
          const s = ai(c.skill);
          return (
            <li key={c.skill} className="rounded-xl bg-white p-3 ring-1 ring-line">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-ink">
                  {c.skill} {c.kind === "must" && <span className="ml-1 rounded bg-slate-100 px-1 text-[10px] font-bold uppercase text-slate-500">must</span>}
                </span>
                <div className="flex gap-1">
                  {STATUSES.map(({ v, icon: Icon, label, on }) => (
                    <button key={v} onClick={() => setChecks((cs) => cs.map((x, k) => (k === i ? { ...x, status: v, evidence: v === s?.status ? s.evidence : x.evidence } : x)))}
                      className={cx("flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition", c.status === v ? on : "border-line bg-white text-muted hover:text-ink")}>
                      <Icon className="size-3" />{label}
                    </button>
                  ))}
                </div>
              </div>
              {s && (
                <p className="mt-2 flex items-start gap-1.5 text-xs text-muted">
                  <Bot className="mt-0.5 size-3.5 shrink-0 text-emp" />
                  <span>AI suggests <b>{STATUSES.find((x) => x.v === s.status)?.label}</b>{s.evidence && <span className="italic"> · <Quote className="inline size-3" /> {s.evidence}</span>}</span>
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {askReason && (
        <div className="rounded-xl bg-white p-3 ring-1 ring-line">
          <p className="mb-2 text-sm font-semibold text-ink">Why not now? The candidate will see it.</p>
          <div className="flex flex-wrap gap-2">
            {REASONS.map((r) => (
              <button key={r} onClick={() => setReason(r)} className={cx("rounded-full border px-3 py-1 text-xs", reason === r ? "border-emp bg-emp text-white" : "border-line hover:border-emp")}>{r}</button>
            ))}
          </div>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Or write your own reason" className="mt-2 w-full rounded-[10px] border border-slate-300 px-3 py-2 text-sm text-ink outline-none focus:border-emp" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button side="emp" onClick={() => decide("invite")} disabled={!decided} loading={busy === "invite"}><CalendarPlus className="size-4" /> Invite to talk</Button>
        <Button side="emp" variant="outline" onClick={() => decide("shortlist")} disabled={!decided} loading={busy === "shortlist"}><Star className="size-4" /> Shortlist</Button>
        <Button side="emp" variant="ghost" onClick={() => decide("not_now")} disabled={!decided} loading={busy === "not_now"}><X className="size-4" /> Not now</Button>
        {!decided && <span className="text-xs text-muted">Choose a status for each line to decide.</span>}
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}

      {(application.log ?? []).length > 0 && (
        <Details side="emp" label="Decision log">
          <ul className="space-y-1 text-xs">
            {application.log!.map((l, i) => (
              <li key={i} className="flex gap-2">
                <span className="w-28 shrink-0 text-muted">{new Date(l.at).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                <Badge tone={l.actor === "ai" ? "nv" : l.actor === "recruiter" ? "emp" : "cand"}>{l.actor === "ai" ? "AI" : l.actor === "recruiter" ? "Recruiter" : "Candidate"}</Badge>
                <span className="text-ink">{l.action}{l.detail ? ` · ${l.detail}` : ""}</span>
              </li>
            ))}
          </ul>
        </Details>
      )}
    </div>
  );
}
