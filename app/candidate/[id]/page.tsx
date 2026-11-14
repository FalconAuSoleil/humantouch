"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowRight, Check, CircleAlert, Eye, EyeOff, Languages, Award, GraduationCap, Mic, Quote, Sparkles } from "lucide-react";
import { loadCandidate, step } from "@/components/snapshot";
import { Badge, Button, Card, Details, ScoreRing, Spinner, Stepper } from "@/components/ui";
import type { Candidate } from "@/lib/types";

export default function PassportPage() {
  const { id } = useParams<{ id: string }>();
  const [c, setC] = useState<Candidate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCandidate(id).then(setC).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <Card className="text-rose-700">{error}</Card>;
  if (!c) return <Spinner />;
  if (!c.passport) {
    return (
      <Card className="text-center">
        <p className="mb-4">Your passport is not written yet.</p>
        <Button href={`/candidate/${id}/interview`}>Continue the interview</Button>
      </Card>
    );
  }
  const p = c.passport;
  const q = c.quality;

  const toggle = async () => {
    setSaving(true);
    setC(await step<Candidate>("c", `/api/candidates/${id}/publish`, id, { visible: !c.visible }));
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <Stepper steps={["CV", "Interview", "Passport", "Jobs"]} current={c.visible ? 3 : 2} />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Card className="overflow-hidden border-t-4 border-t-cand p-0">
            <div className="relative p-7" style={{ background: "radial-gradient(560px 380px at 96% -4%, rgba(88,83,255,0.14), transparent 70%), radial-gradient(520px 380px at -4% 104%, rgba(255,44,155,0.08), transparent 70%), #fcf8ff" }}>
              <p className="eyebrow">Skills Passport</p>
              <div className="mt-4 flex flex-wrap items-center gap-5">
                <div className="size-24 shrink-0 rounded-full bg-gradient-to-br from-cand to-rose p-1">
                  <span className="flex size-full items-center justify-center rounded-full bg-white text-3xl font-extrabold text-cand">{c.firstName.slice(0, 1).toUpperCase()}</span>
                </div>
                <div className="min-w-0">
                  <h1 className="text-4xl font-extrabold tracking-tight">{c.firstName}</h1>
                  <p className="mt-0.5 text-xl font-bold text-cand-dark">{p.headline}</p>
                </div>
              </div>
              <div className="relative mt-5 max-w-2xl pt-4 text-body">
                <span className="signature absolute left-0 top-0 h-[3px] w-14 rounded" />
                {p.summary}
              </div>
              {(p.ownWords ?? []).length > 0 && (
                <div className="mt-4 space-y-1.5 rounded-2xl bg-white/80 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-rose">In {c.firstName}&apos;s words</p>
                  {p.ownWords.map((w) => <p key={w} className="flex gap-2 italic text-ink"><Quote className="mt-1 size-4 shrink-0 text-rose" />{w}</p>)}
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {p.topSkills.map((s) => <span key={s} className="rounded-full bg-white px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-profond">{s}</span>)}
              </div>
            </div>
            <div className="grid gap-5 p-6 sm:grid-cols-3">
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase text-muted">Technical</h3>
                <ul className="space-y-1 text-sm">{p.technicalSkills.map((s) => <li key={s}>{s}</li>)}</ul>
              </div>
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase text-muted">Functional</h3>
                <ul className="space-y-1 text-sm">{p.functionalSkills.map((s) => <li key={s}>{s}</li>)}</ul>
              </div>
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase text-muted">Tools</h3>
                <div className="flex flex-wrap gap-1.5">{p.tools.map((s) => <Badge key={s}>{s}</Badge>)}</div>
              </div>
            </div>
          </Card>

          {p.transferableSkills.length > 0 && (
            <Card>
              <h2 className="mb-3 flex items-center gap-2 font-bold"><Sparkles className="size-4 text-cand" /> Transferable skills</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {p.transferableSkills.map((t) => (
                  <div key={t.skill} className="rounded-[14px] bg-soft p-3" style={{ boxShadow: "inset 4px 0 0 #5853ff" }}>
                    <p className="font-semibold text-ink">{t.skill}</p>
                    <p className="text-sm text-body">{t.proof}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <h2 className="mb-4 font-bold">Experience</h2>
            <div className="space-y-6">
              {p.experiences.map((e, i) => (
                <div key={i} className="relative border-l-2 border-cand/30 pl-5">
                  <span className="absolute -left-[7px] top-1.5 size-3 rounded-full bg-cand" />
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-lg font-bold">{e.title} <span className="font-medium text-muted">· {e.organization}</span></h3>
                    <span className="text-xs text-muted">{[e.start, e.end ?? "now"].filter(Boolean).join(" → ")}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {e.sector && <Badge>{e.sector}</Badge>}
                    {e.kind !== "job" && <Badge tone="amber">{e.kind}</Badge>}
                    {e.source !== "documents" && <Badge tone="cand"><Mic className="size-3" /> confirmed</Badge>}
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{e.context}</p>
                  {e.achievements.length > 0 && (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{e.achievements.map((a) => <li key={a}>{a}</li>)}</ul>
                  )}
                  {e.results.length > 0 && (
                    <div className="mt-3 rounded-[14px] bg-cand p-3 text-white" style={{ boxShadow: "inset 0 3px 0 #ff2c9b" }}>
                      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-jaune">Results</p>
                      <ul className="space-y-1 text-sm text-white">{e.results.map((r) => <li key={r} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0" />{r}</li>)}</ul>
                    </div>
                  )}
                  {e.tools.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{e.tools.map((t) => <Badge key={t}>{t}</Badge>)}</div>}
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-5 sm:grid-cols-3">
            <Card>
              <h3 className="mb-2 flex items-center gap-1.5 font-bold"><Languages className="size-4" /> Languages</h3>
              <ul className="space-y-1 text-sm">{p.languages.map((l) => <li key={l.name} className="flex justify-between"><span>{l.name}</span><span className="text-muted">{l.level}</span></li>)}</ul>
            </Card>
            <Card>
              <h3 className="mb-2 flex items-center gap-1.5 font-bold"><GraduationCap className="size-4" /> Education</h3>
              <ul className="space-y-1 text-sm">{p.education.map((e) => <li key={e.degree}>{e.degree} <span className="text-muted">· {e.school}</span></li>)}</ul>
            </Card>
            <Card>
              <h3 className="mb-2 flex items-center gap-1.5 font-bold"><Award className="size-4" /> Certificates</h3>
              <ul className="space-y-1 text-sm">{[...p.certifications, ...p.projects].map((x) => <li key={x}>{x}</li>)}</ul>
            </Card>
          </div>
        </div>

        <div className="space-y-5">
          <Card>
            <div className="flex flex-col gap-2">
              <Button href={`/candidate/${id}/jobs`} size="lg">See jobs <ArrowRight className="size-4" /></Button>
              <button onClick={toggle} disabled={saving} className="flex items-center justify-center gap-2 rounded-full py-2 text-sm font-semibold text-muted hover:bg-soft">
                {c.visible ? <><Eye className="size-4 text-cand" /> Visible to employers (anonymous)</> : <><EyeOff className="size-4" /> Hidden from employers</>}
              </button>
            </div>
          </Card>

          {q && (
            <Card>
              <div className="flex items-center gap-4">
                <ScoreRing score={q.score} size={60} />
                <div>
                  <h3 className="font-bold">Passport strength</h3>
                  <p className="text-xs text-muted">{q.checks.filter((x) => x.ok).length} of {q.checks.length} checks passed</p>
                </div>
              </div>
              {q.checks.some((x) => !x.ok) && (
                <ul className="mt-3 space-y-1.5 text-sm">
                  {q.checks.filter((x) => !x.ok).map((ch) => (
                    <li key={ch.id} className="flex gap-2 text-ink"><CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-500" />{ch.label}</li>
                  ))}
                </ul>
              )}
              <div className="mt-3">
                <Details label="All checks">
                  <ul className="space-y-1.5 text-sm">
                    {q.checks.map((ch) => (
                      <li key={ch.id} className="flex gap-2">
                        {ch.ok ? <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" /> : <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-500" />}
                        <span>{ch.label}</span>
                      </li>
                    ))}
                  </ul>
                </Details>
              </div>
            </Card>
          )}

          {p.toVerify.length > 0 && (
            <Card className="bg-amber-50">
              <h3 className="font-bold">To add</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink">{p.toVerify.slice(0, 4).map((t) => <li key={t}>{t}</li>)}</ul>
            </Card>
          )}

          {(p.preferences.targetRoles.length > 0 || p.preferences.remote) && (
            <Card>
              <h3 className="font-bold">Looking for</h3>
              <p className="mt-1 text-sm">{p.preferences.targetRoles.join(", ")}</p>
              <p className="text-sm text-muted">{[p.preferences.location, p.preferences.remote, p.preferences.availability].filter(Boolean).join(" · ")}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
