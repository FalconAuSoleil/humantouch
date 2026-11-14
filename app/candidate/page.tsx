"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, IdCard, X, ArrowRight } from "lucide-react";
import { api } from "@/components/api";
import { saveSnapshot, step as runStep } from "@/components/snapshot";
import type { Candidate } from "@/lib/types";
import { readDocument } from "@/components/pdf";
import { AiSteps, Button, Card, cx } from "@/components/ui";

function DropZone({ label, hint, icon: Icon, file, onFile }: { label: string; hint: string; icon: typeof FileText; file: File | null; onFile: (f: File | null) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <div
      onClick={() => input.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onFile(e.dataTransfer.files[0] ?? null); }}
      className={cx("relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed bg-white p-6 text-center transition",
        file ? "border-cand bg-cand-soft/40" : over ? "border-cand bg-cand-soft/30" : "border-slate-300 hover:border-cand")}
    >
      <input ref={input} type="file" accept=".pdf,image/*,.txt" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
      <Icon className={cx("size-8", file ? "text-cand" : "text-slate-400")} />
      <p className="font-semibold">{label}</p>
      {file ? (
        <p className="flex items-center gap-1 text-sm text-teal-800">
          {file.name}
          <button className="rounded p-0.5 hover:bg-white" onClick={(e) => { e.stopPropagation(); onFile(null); }}><X className="size-4" /></button>
        </p>
      ) : (
        <p className="text-xs text-muted">{hint}</p>
      )}
    </div>
  );
}

const STEPS = ["Reading your CV", "Understanding your experience", "Preparing your questions"];

export default function CandidateHome() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [cv, setCv] = useState<File | null>(null);
  const [linkedin, setLinkedin] = useState<File | null>(null);
  const [step, setStep] = useState(-1);
  const [error, setError] = useState<string | null>(null);


  async function start() {
    setError(null);
    try {
      setStep(0);
      const docs = [];
      if (cv) docs.push({ kind: "cv", name: cv.name, ...(await readDocument(cv)) });
      if (linkedin) docs.push({ kind: "linkedin", name: linkedin.name, ...(await readDocument(linkedin)) });
      const c = await api<Candidate>("/api/candidates", { firstName });
      saveSnapshot("c", c);
      setStep(1);
      await runStep("c", `/api/candidates/${c.id}/extract`, c.id, { docs });
      setStep(2);
      await runStep("c", `/api/candidates/${c.id}/brief`, c.id);
      setStep(3);
      router.push(`/candidate/${c.id}/interview`);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const busy = step >= 0 && !error;

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.5fr_1fr]">
      <Card className="self-start p-8">
        <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Your first name"
          className="w-full rounded-[10px] border border-slate-300 px-4 py-3 text-lg text-ink outline-none focus:border-cand focus:ring-3 focus:ring-cand/20" />

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <DropZone label="CV" hint="PDF or photo" icon={FileText} file={cv} onFile={setCv} />
          <DropZone label="LinkedIn PDF" hint="Optional" icon={IdCard} file={linkedin} onFile={setLinkedin} />
        </div>

        {step >= 0 ? (
          <div className="mt-6 rounded-2xl bg-soft p-5">
            <AiSteps steps={STEPS} current={step} error={error} />
            {error && <div className="mt-3"><Button onClick={() => { setStep(-1); setError(null); }} variant="outline">Try again</Button></div>}
          </div>
        ) : (
          <div className="mt-6">
            <Button size="lg" onClick={start} disabled={!firstName.trim()} loading={busy}>Start <ArrowRight className="size-4" /></Button>
          </div>
        )}
      </Card>

      <Card className="self-start">
        <h2 className="font-bold">See an example</h2>
        <p className="mb-2 text-xs text-muted">A finished passport and its applications.</p>
        <Link href="/candidate/elena01/jobs" className="-mx-2 flex items-center gap-3 rounded-xl p-2 hover:bg-soft">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cand-soft font-bold text-cand">E</span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-ink">Elena · Café Shift Supervisor</span>
            <span className="block truncate text-xs text-muted">Applied to Kahvila Aalto</span>
          </span>
          <ArrowRight className="size-4 text-muted" />
        </Link>
      </Card>
    </div>
  );
}
