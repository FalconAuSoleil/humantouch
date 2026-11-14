"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/components/api";
import { loadJob, step } from "@/components/snapshot";
import { Card, Spinner, Stepper } from "@/components/ui";
import { RealtimeInterview } from "@/components/RealtimeInterview";
import { VoiceInterview, type InterviewData } from "@/components/VoiceInterview";
import type { Job } from "@/lib/types";

const toData = (j: Job): InterviewData => ({ interview: j.interview, questions: j.brief?.questions ?? [] });
const SECTIONS = { role: "The role", essentials: "Essentials", day: "A real day", team: "Team", practical: "Practical" };

export default function JobInterview() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [realtime, setRealtime] = useState<boolean | null>(null);
  const [initial, setInitial] = useState<InterviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [j, status] = await Promise.all([loadJob(id), api<{ realtime: boolean }>("/api/status").catch(() => ({ realtime: false }))]);
      setJob(j);
      setRealtime(status.realtime);
      if (!status.realtime) {
        const ready = j.interview.turns.length === 0 ? await step<Job>("j", `/api/jobs/${id}/interview`, id) : j;
        setInitial(toData(ready));
      }
    })().catch((e) => setError(e.message));
  }, [id]);

  if (error) return <Card className="text-rose-700">{error}</Card>;
  if (!job || realtime === null || (!realtime && !initial)) return <Spinner label="Preparing the questions" />;

  const title = `${job.draft.title || "New job"} · ${job.company}`;
  const writePost = async () => {
    await step<Job>("j", `/api/jobs/${id}/write`, id);
    router.push(`/employer/jobs/${id}`);
  };

  return (
    <div className="space-y-6">
      <Stepper side="emp" steps={["Draft", "Talk", "Publish", "Meet people"]} current={1} />
      {realtime ? (
        <RealtimeInterview
          side="emp" kind="j" id={id} title={title} questions={job.brief?.questions ?? []} names={SECTIONS}
          finishSteps={["Conversation done", "Writing your job offer", "Checking it"]}
          onDone={async (transcript) => {
            await step<Job>("j", `/api/jobs/${id}/transcript`, id, transcript);
            await writePost();
          }}
        />
      ) : (
        <VoiceInterview
          side="emp" title={title} initial={initial!} names={SECTIONS}
          keyterms={[job.company, job.draft.title, ...(job.brief?.listedSkills ?? [])].filter(Boolean)}
          finishSteps={["Conversation done", "Writing your job offer", "Checking it"]}
          onAnswer={async (answer) => toData(await step<Job>("j", `/api/jobs/${id}/interview`, id, { answer }))}
          onFinish={writePost}
        />
      )}
    </div>
  );
}
