"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CalendarPlus, Check, ChevronDown, CircleAlert, EyeOff, Languages, MessageSquareQuote, Mic, Quote, Rocket, Star, UserCheck } from "lucide-react";
import { api } from "@/components/api";
import { loadJob, saveSnapshot, snapshotList, step } from "@/components/snapshot";
import { ReviewPanel } from "@/components/ReviewPanel";
import { PostingView } from "@/components/PostingView";
import { Badge, Button, Card, Details, Empty, ScoreRing, Spinner, Stepper, cx } from "@/components/ui";
import type { Application, Candidate, Job } from "@/lib/types";

type Person = {
  application: Application | null;
  candidate: {
    id: string; label: string; revealed: boolean; headline: string; summary: string; topSkills: string[]; tools: string[]; ownWords: string[];
    languages: { name: string; level: string }[]; experiences: { title: string; sector: string | null; results: string[] }[]; availability: string | null;
  };
};

function PersonCard({ person: { application: a, candidate: c }, onInvite, job, onApplication }: { person: Person; onInvite: (id: string) => void; job: Job; onApplication: (a: Application) => void }) {
  const applied = a?.initiatedBy === "candidate";
  return (
    <Card className={cx("fade-up p-6", a?.initiatedBy === "candidate" && "border-cand")}>
      <div className="flex flex-wrap items-center gap-5">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-cand-soft text-xl font-bold text-cand">
          {c.revealed ? c.label.slice(0, 1) : <EyeOff className="size-6" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold">{c.label}</h3>
            {c.revealed && <Badge tone="cand"><UserCheck className="size-3" /> Applied</Badge>}
          </div>
          <p className="text-ink">{c.headline}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">{c.topSkills.map((s) => <Badge key={s} tone="emp">{s}</Badge>)}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {!a && <Button side="emp" onClick={() => onInvite(c.id)}><CalendarPlus className="size-4" /> Invite</Button>}
          {a?.decision === "shortlist" && <Badge tone="emp"><Star className="size-3" /> Shortlisted</Badge>}
          {a?.status === "invited" && <Badge tone="amber">Invited</Badge>}
          {a?.status === "accepted" && <Badge tone="green"><Check className="size-3" /> {a.slot}</Badge>}
          {a?.status === "declined" && <Badge>Not now</Badge>}
          {typeof a?.score === "number" && <span className="text-xs font-semibold text-emp">Your score: {a.score}</span>}
        </div>
      </div>
      {c.ownWords[0] && (
        <p className="mt-4 flex gap-2 rounded-xl bg-soft p-3 text-sm italic text-ink"><Quote className="size-4 shrink-0 text-rose" />{c.ownWords[0]}</p>
      )}
      {a?.note && <p className="mt-2 flex gap-2 rounded-xl bg-cand-soft/60 p-3 text-sm italic"><MessageSquareQuote className="size-4 shrink-0 text-cand" />{a.note}</p>}
      {a?.reply && <p className="mt-2 flex gap-2 rounded-xl bg-cand-soft/60 p-3 text-sm"><MessageSquareQuote className="size-4 shrink-0 text-cand" /><span><b>Candidate added:</b> {a.reply}</span></p>}
      {applied && a && <div className="mt-4"><ReviewPanel application={a} job={job} onChange={onApplication} /></div>}
      <div className="mt-3">
        <Details side="emp" label="See passport">
          <div className="space-y-3 text-sm">
            <p className="text-body">{c.summary}</p>
            {c.experiences.map((e) => (
              <div key={e.title}>
                <p className="font-semibold text-ink">{e.title}{e.sector ? ` · ${e.sector}` : ""}</p>
                <ul className="list-disc pl-5">{e.results.map((r) => <li key={r}>{r}</li>)}</ul>
              </div>
            ))}
            <p className="flex items-center gap-1 text-xs text-muted"><Languages className="size-3" />{c.languages.map((l) => `${l.name} ${l.level}`).join(" · ")}{c.availability ? ` · Available: ${c.availability}` : ""}</p>
          </div>
        </Details>
      </div>
    </Card>
  );
}

export default function JobPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [people, setPeople] = useState<Person[] | null>(null);
  const [showPosting, setShowPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJob(id).then(setJob).catch((e) => setError(e.message));
    api<Person[]>(`/api/jobs/${id}/people`)
      .catch(() => [] as Person[])
      .then((server) => {
        // Passports shared from this browser show up even when the server instance does not know them yet.
        const local = snapshotList<Candidate>("c").filter((c) => c.visible && c.passport && !server.some((r) => r.candidate.id === c.id));
        const localApps = snapshotList<Application>("a").filter((a) => a.jobId === id);
        const pick = (srv: Application | null, cid: string) => {
          const loc = localApps.find((a) => a.candidateId === cid);
          if (!loc) return srv;
          if (!srv) return loc;
          return (loc.log?.length ?? 0) > (srv.log?.length ?? 0) ? loc : srv;
        };
        setPeople([
          ...server.map((r) => ({ ...r, application: pick(r.application, r.candidate.id) })),
          ...local.map((c) => ({
            application: pick(null, c.id),
            candidate: {
              id: c.id, label: `Talent #${c.id.slice(0, 3).toUpperCase()}`, revealed: false, headline: c.passport!.headline, summary: c.passport!.summary,
              topSkills: c.passport!.topSkills, tools: c.passport!.tools, ownWords: c.passport!.ownWords ?? [], languages: c.passport!.languages,
              experiences: c.passport!.experiences.slice(0, 3).map((e) => ({ title: e.title, sector: e.sector, results: e.results })), availability: c.passport!.preferences.availability,
            },
          })),
        ]);
      });
  }, [id]);

  const invite = async (candidateId: string) => {
    const a = await api<Application>("/api/applications", { candidateId, jobId: id, by: "employer" });
    saveSnapshot("a", a);
    setPeople((rs) => rs!.map((r) => (r.candidate.id === candidateId ? { ...r, application: a } : r)));
  };
  const onApplication = (a: Application) => setPeople((rs) => rs!.map((r) => (r.candidate.id === a.candidateId ? { ...r, application: a } : r)));

  const publish = async () => setJob(await step<Job>("j", `/api/jobs/${id}/publish`, id));

  if (error) return <Card className="text-rose-700">{error}</Card>;
  if (!job) return <Spinner />;

  if (!job.posting) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <p className="mb-4 font-semibold">This job post is not written yet.</p>
        <Button side="emp" onClick={() => router.push(`/employer/jobs/${id}/interview`)}><Mic className="size-4" /> Talk to the AI</Button>
      </Card>
    );
  }

  if (job.status !== "published") {
    const q = job.quality;
    return (
      <div className="space-y-6">
        <Stepper side="emp" steps={["Draft", "Talk", "Publish", "Meet people"]} current={2} />
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Card className="p-7"><PostingView p={job.posting} company={job.company} /></Card>
          <div className="space-y-4">
            <Card><Button side="emp" size="lg" onClick={publish}><Rocket className="size-4" /> Publish</Button></Card>
            {q && (
              <Card>
                <div className="flex items-center gap-4">
                  <ScoreRing score={q.score} size={60} />
                  <div><h3 className="font-bold">Job post quality</h3><p className="text-xs text-muted">{q.checks.filter((c) => c.ok).length} of {q.checks.length} golden rules</p></div>
                </div>
                {q.checks.some((c) => !c.ok) && (
                  <ul className="mt-3 space-y-1.5 text-sm">
                    {q.checks.filter((c) => !c.ok).map((c) => <li key={c.id} className="flex gap-2 text-ink"><CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-500" />{c.label}</li>)}
                  </ul>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Ordered by the recruiter's own score; applications not yet reviewed come first so none is overlooked.
  const rankOf = (a: Application | null) => (a?.status === "declined" ? -1 : typeof a?.score === "number" ? a.score : 1000);
  const applied = (people?.filter((r) => r.application?.initiatedBy === "candidate") ?? []).sort((x, y) => rankOf(y.application) - rankOf(x.application));
  const others = people?.filter((r) => r.application?.initiatedBy !== "candidate") ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card>
        <button className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setShowPosting(!showPosting)}>
          <div>
            <h1 className="text-2xl font-extrabold">{job.posting.title}</h1>
            <p className="text-muted">{job.company}</p>
          </div>
          <span className="flex items-center gap-1 text-sm font-semibold text-emp">{showPosting ? "Hide" : "See"} job post <ChevronDown className={cx("size-4 transition", showPosting && "rotate-180")} /></span>
        </button>
        {showPosting && <div className="mt-5 border-t border-line pt-5"><PostingView p={job.posting} company={job.company} /></div>}
      </Card>

      {!people ? <Spinner /> : (
        <>
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold">Applications <span className="text-muted">({applied.length})</span></h2>
            <p className="text-sm text-muted">The AI can pre-check the evidence. You confirm, you score, you decide.</p>
            {applied.length === 0 ? <Empty>No one yet.</Empty> : applied.map((r) => <PersonCard key={r.candidate.id} person={r} onInvite={invite} job={job} onApplication={onApplication} />)}
          </section>
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold">Browse passports <span className="text-muted">({others.length})</span></h2>
            <p className="text-sm text-muted">Anonymous until they apply. You choose who to invite.</p>
            {others.map((r) => <PersonCard key={r.candidate.id} person={r} onInvite={invite} job={job} onApplication={onApplication} />)}
          </section>
        </>
      )}
    </div>
  );
}
