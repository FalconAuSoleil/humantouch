"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, FileUp, X } from "lucide-react";
import { api } from "@/components/api";
import { readDocument } from "@/components/pdf";
import { saveSnapshot, snapshotList } from "@/components/snapshot";
import { AiSteps, Badge, Button, Card } from "@/components/ui";
import type { Job } from "@/lib/types";

const EXAMPLE = `Looking for a young and dynamic shift lead for our café. Must have 5+ years of experience and a hospitality degree. Native Finnish speaker. Barista skills, cash handling, stock ordering, staff scheduling, social media, cake baking, latte art, driving licence, first aid. Fast-paced environment.`;

export default function Employer() {
  const router = useRouter();
  const [mine, setMine] = useState<Job[]>([]);
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setMine(snapshotList<Job>("j")), 0);
    return () => clearTimeout(t);
  }, []);

  const start = async () => {
    setError(null);
    setStep(0);
    try {
      let images: string[] = [];
      let extra = "";
      if (file) {
        const d = await readDocument(file);
        images = d.images;
        extra = d.text;
      }
      setStep(1);
      const j = await api<Job>("/api/jobs", { company, title, text: [text, extra].filter(Boolean).join("\n\n"), images });
      saveSnapshot("j", j);
      router.push(`/employer/jobs/${j.id}/interview`);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const input = "w-full rounded-[10px] border border-slate-300 px-4 py-3 text-ink outline-none focus:border-emp focus:ring-3 focus:ring-emp/20";

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.5fr_1fr]">
      <Card className="self-start p-8 lg:row-span-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company" className={input} />
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Job title" className={input} />
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} placeholder="Your job offer, even a rough draft" className={`${input} mt-4`} />
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Button side="emp" variant="ghost" size="sm" onClick={() => fileInput.current?.click()}><FileUp className="size-4" /> Upload an old offer</Button>
          <input ref={fileInput} type="file" accept=".pdf,image/*,.txt" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          {file && <Badge tone="emp">{file.name} <button onClick={() => setFile(null)}><X className="size-3" /></button></Badge>}
          <button className="ml-auto text-xs font-semibold text-emp hover:underline" onClick={() => { setText(EXAMPLE); setCompany(company || "Kahvila Aalto"); setTitle(title || "Café shift lead"); }}>
            Use an example
          </button>
        </div>
        {step >= 0 ? (
          <div className="mt-6 rounded-2xl bg-soft p-5">
            <AiSteps steps={["Reading your offer", "Preparing your questions"]} current={step} error={error} />
            {error && <div className="mt-3"><Button side="emp" variant="outline" onClick={() => setStep(-1)}>Try again</Button></div>}
          </div>
        ) : (
          <div className="mt-6">
            <Button side="emp" size="lg" onClick={start} disabled={!text.trim() && !file}>Start <ArrowRight className="size-4" /></Button>
          </div>
        )}
      </Card>

      <Card className="self-start lg:col-start-2 lg:row-start-1">
        <h2 className="font-bold">See how review works</h2>
        <p className="mb-2 text-xs text-muted">Example offers with applications to assess.</p>
        <ul className="-mx-2">
          {[
            { id: "cafe01", title: "Café Shift Lead", company: "Kahvila Aalto", n: 2 },
            { id: "care02", title: "Nurse Coordinator", company: "Tapiola Health Centre", n: 2 },
          ].map((e) => (
            <li key={e.id}>
              <Link href={`/employer/jobs/${e.id}`} className="flex items-center gap-3 rounded-xl p-2 hover:bg-soft">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emp-soft font-bold text-emp">{e.company.slice(0, 1)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-ink">{e.title}</span>
                  <span className="block truncate text-xs text-muted">{e.company} · {e.n} applications to review</span>
                </span>
                <ArrowRight className="size-4 text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      {mine.length > 0 && (
        <Card className="self-start lg:col-start-2">
          <h2 className="mb-2 font-bold">Continue</h2>
          <ul className="-mx-2">
            {mine.map((j) => (
              <li key={j.id}>
                <Link href={j.posting ? `/employer/jobs/${j.id}` : `/employer/jobs/${j.id}/interview`} className="flex items-center gap-3 rounded-xl p-2 hover:bg-soft">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emp-soft font-bold text-emp">{j.company.slice(0, 1)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-ink">{j.posting?.title ?? (j.draft.title || "New job")}</span>
                    <span className="block truncate text-xs text-muted">{j.company} · {j.status === "published" ? "Published" : j.posting ? "Ready to publish" : "In progress"}</span>
                  </span>
                  <ArrowRight className="size-4 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
