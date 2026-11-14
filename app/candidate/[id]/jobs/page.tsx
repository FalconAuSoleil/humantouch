"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CalendarCheck, MapPin, Volume2, Wallet, Languages, Send, Check, Quote } from "lucide-react";
import { api } from "@/components/api";
import { loadCandidate, saveSnapshot, snapshotList } from "@/components/snapshot";
import { ApplicationStatus } from "@/components/ApplicationStatus";
import { useVoice } from "@/components/voice";
import { PostingView } from "@/components/PostingView";
import { Badge, Button, Card, Details, Empty, Spinner, Stepper } from "@/components/ui";
import type { Application, Job, Posting } from "@/lib/types";

type Row = { job: { id: string; company: string; posting: Posting }; application: Application | null };

export default function Jobs() {
  const { id } = useParams<{ id: string }>();
  const voice = useVoice();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [name, setName] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    loadCandidate(id).then((c) => setName(c.firstName)).catch(() => undefined);
    api<Row[]>(`/api/candidates/${id}/jobs`)
      .catch(() => [] as Row[])
      .then((server) => {
        // Jobs published from this browser show up even when the server instance does not know them yet.
        const local = snapshotList<Job>("j").filter((j) => j.status === "published" && j.posting && !server.some((r) => r.job.id === j.id));
        const localApps = snapshotList<Application>("a").filter((a) => a.candidateId === id);
        const pick = (srv: Application | null, jobId: string) => {
          const loc = localApps.find((a) => a.jobId === jobId);
          if (!loc) return srv;
          if (!srv) return loc;
          return (loc.log?.length ?? 0) > (srv.log?.length ?? 0) ? loc : srv;
        };
        setRows([...local.map((j) => ({ job: { id: j.id, company: j.company, posting: j.posting! }, application: pick(null, j.id) })), ...server.map((r) => ({ ...r, application: pick(r.application, r.job.id) }))]);
      });
  }, [id]);

  const apply = async (jobId: string) => {
    setBusy(jobId);
    const existing = rows?.find((r) => r.job.id === jobId)?.application;
    const a = await api<Application>("/api/applications", { candidateId: id, jobId, note, by: "candidate", snapshot: existing ?? undefined });
    saveSnapshot("a", a);
    setRows((rs) => rs!.map((r) => (r.job.id === jobId ? { ...r, application: a } : r)));
    setOpen(null);
    setNote("");
    setBusy(null);
  };

  const listen = (p: Posting, company: string) =>
    voice.speak(`${p.title} at ${company}. ${p.managerWords?.[0] ?? ""} ${p.summary} What really matters: ${p.mustHave.map((m) => m.skill).join(", ")}.`);

  const sorted = rows ? [...rows].sort((a, b) => Number(b.application?.status === "invited") - Number(a.application?.status === "invited")) : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Stepper steps={["CV", "Interview", "Passport", "Jobs"]} current={3} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight">Jobs in Espoo</h1>
        <Button href={`/candidate/${id}`} variant="outline" size="sm">{name ? `${name}'s passport` : "My passport"}</Button>
      </div>

      {!sorted && <Spinner />}
      {sorted && sorted.length === 0 && <Empty>No jobs yet.</Empty>}

      <div className="space-y-4">
        {sorted?.map(({ job, application: a }) => {
          const p = job.posting;
          return (
            <Card key={job.id} className="fade-up p-6">
              {a?.status === "invited" && (
                <div className="-mx-6 -mt-6 mb-5 flex flex-wrap items-center justify-between gap-2 rounded-t-2xl bg-emp px-6 py-3 text-white">
                  <span className="flex items-center gap-2 font-semibold"><CalendarCheck className="size-5" /> {job.company} wants to meet you · {a.slot}</span>
                  <button onClick={() => apply(job.id)} className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-emp">Accept</button>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-5">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-emp-soft text-xl font-bold text-emp">{job.company.slice(0, 1)}</div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-bold">{p.title}</h2>
                  <p className="text-muted">{job.company}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="flex items-center gap-1 rounded-full bg-soft px-2.5 py-1"><MapPin className="size-3.5" />{p.location.split(",")[0]} · {p.remote.split(",")[0]}</span>
                    {p.salary && <span className="flex items-center gap-1 rounded-full bg-soft px-2.5 py-1"><Wallet className="size-3.5" />{p.salary}</span>}
                    <span className="flex items-center gap-1 rounded-full bg-soft px-2.5 py-1"><Languages className="size-3.5" />{p.finnishRequired ? "Finnish needed" : "English OK"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => listen(p, job.company)} title="Listen" className="flex size-10 items-center justify-center rounded-full text-cand hover:bg-cand-soft"><Volume2 className="size-5" /></button>
                  {a && a.status !== "invited" ? (
                    <Badge tone="green"><Check className="size-3" /> {a.status === "accepted" ? a.slot ?? "Meeting booked" : "Applied"}</Badge>
                  ) : (
                    <Button onClick={() => setOpen(open === job.id ? null : job.id)}>I&apos;m interested</Button>
                  )}
                </div>
              </div>

              {p.managerWords?.[0] && (
                <p className="mt-4 flex gap-2 rounded-xl bg-emp-soft/50 p-3 text-sm italic text-ink"><Quote className="size-4 shrink-0 text-emp" />{p.managerWords[0]}</p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-4">
                <span className="text-sm text-ink">What really matters: <b>{p.mustHave.map((m) => m.skill).join(" · ")}</b></span>
                <Details label="See the job">
                  <PostingView p={p} company={job.company} />
                </Details>
              </div>

              {a && a.initiatedBy === "candidate" && (
                <ApplicationStatus application={a} onChange={(next) => setRows((rs) => rs!.map((r) => (r.job.id === job.id ? { ...r, application: next } : r)))} />
              )}

              {open === job.id && (
                <div className="mt-4 rounded-2xl bg-soft p-4">
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Why this job? (optional, in your words)"
                    className="w-full rounded-[10px] border border-slate-300 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-cand" />
                  <div className="mt-2 flex items-center gap-3">
                    <Button onClick={() => apply(job.id)} loading={busy === job.id}><Send className="size-4" /> Send my passport</Button>
                    <span className="text-xs text-muted">{job.company} sees your first name. An AI may help them check evidence; a person decides.</span>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
