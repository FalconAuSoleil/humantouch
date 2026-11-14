"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/components/api";
import { loadCandidate, step } from "@/components/snapshot";
import { Card, Spinner, Stepper } from "@/components/ui";
import { RealtimeInterview } from "@/components/RealtimeInterview";
import { VoiceInterview, type InterviewData } from "@/components/VoiceInterview";
import type { Candidate } from "@/lib/types";

const toData = (c: Candidate): InterviewData => ({ interview: c.interview, questions: c.brief?.questions ?? [] });

export default function InterviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [c, setC] = useState<Candidate | null>(null);
  const [realtime, setRealtime] = useState<boolean | null>(null);
  const [initial, setInitial] = useState<InterviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [cand, status] = await Promise.all([loadCandidate(id), api<{ realtime: boolean }>("/api/status").catch(() => ({ realtime: false }))]);
      setC(cand);
      setRealtime(status.realtime);
      if (!status.realtime) {
        const ready = cand.interview.turns.length === 0 ? await step<Candidate>("c", `/api/candidates/${id}/interview`, id) : cand;
        setInitial(toData(ready));
      }
    })().catch((e) => setError(e.message));
  }, [id]);

  if (error) return <Card className="text-rose-700">{error}</Card>;
  if (!c || realtime === null || (!realtime && !initial)) return <Spinner label="Preparing your interview" />;

  const names = Object.fromEntries((c.profile?.experiences ?? []).map((e) => [e.ref, e.client || e.organization]));
  const keyterms = [
    ...(c.profile?.experiences ?? []).flatMap((e) => [e.organization, e.client ?? "", e.title, ...e.tools]),
    ...(c.profile?.projects ?? []).map((x) => x.name),
    ...(c.profile?.skills ?? []),
    "vibe coding", "vibecoded", "AI", "LLM",
  ].filter(Boolean);
  const writePassport = async () => {
    await step<Candidate>("c", `/api/candidates/${id}/passport`, id);
    router.push(`/candidate/${id}`);
  };

  return (
    <div className="space-y-6">
      <Stepper steps={["CV", "Interview", "Passport", "Jobs"]} current={1} />
      {realtime ? (
        <RealtimeInterview
          side="cand" kind="c" id={id} title={c.firstName} questions={c.brief?.questions ?? []} names={names}
          finishSteps={["Interview done", "Writing your passport", "Checking the facts"]}
          onDone={async (transcript) => {
            await step<Candidate>("c", `/api/candidates/${id}/transcript`, id, transcript);
            await writePassport();
          }}
        />
      ) : (
        <VoiceInterview
          side="cand" title={c.firstName} initial={initial!} names={names} keyterms={keyterms}
          finishSteps={["Interview done", "Writing your passport", "Checking the facts"]}
          onAnswer={async (answer) => toData(await step<Candidate>("c", `/api/candidates/${id}/interview`, id, { answer }))}
          onFinish={writePassport}
        />
      )}
    </div>
  );
}
