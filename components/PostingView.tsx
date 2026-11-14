"use client";
import { Check, Languages, MapPin, Plane, Quote, Sun, Target, Users, Wallet, ListOrdered, Heart, Mountain, Sprout } from "lucide-react";
import type { Posting } from "@/lib/types";
import { Badge } from "./ui";

export function PostingView({ p, company }: { p: Posting; company: string }) {
  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-2xl font-extrabold">{p.title}</h2>
          <Badge tone="emp">{p.level}</Badge>
        </div>
        <p className="font-semibold text-muted">{company}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="flex items-center gap-1 rounded-full bg-soft px-2.5 py-1"><MapPin className="size-3.5" />{p.location} · {p.remote}</span>
          {p.salary && <span className="flex items-center gap-1 rounded-full bg-soft px-2.5 py-1"><Wallet className="size-3.5" />{p.salary}</span>}
          <span className="flex items-center gap-1 rounded-full bg-soft px-2.5 py-1"><Languages className="size-3.5" />{p.finnishRequired ? "Finnish needed" : `${p.workingLanguage} · Finnish not needed`}</span>
        </div>
      </div>

      {(p.managerWords ?? []).length > 0 && (
        <div className="rounded-2xl bg-emp-soft/60 p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-emp-dark">From the hiring manager</p>
          {p.managerWords.map((w) => (
            <p key={w} className="flex gap-2 italic text-ink"><Quote className="mt-1 size-4 shrink-0 text-emp" />{w}</p>
          ))}
        </div>
      )}

      <p className="text-body">{p.summary}</p>

      <Section icon={Target} title="Success after a few months">
        <ul className="space-y-1">{p.outcomes.map((o) => <li key={o} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-emp" />{o}</li>)}</ul>
      </Section>
      <div className="grid gap-4 sm:grid-cols-2">
        <Section icon={Check} title={`What really matters (${p.mustHave.length})`}>
          <ul className="space-y-1.5">{p.mustHave.map((m) => <li key={m.skill}><b className="text-ink">{m.skill}</b><span className="block text-xs text-muted">{m.evidence}</span></li>)}</ul>
        </Section>
        {p.niceToHave.length > 0 && (
          <Section icon={Heart} title="A bonus, not required">
            <div className="flex flex-wrap gap-1.5">{p.niceToHave.map((m) => <Badge key={m.skill}>{m.skill}</Badge>)}</div>
          </Section>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {(p.aDay ?? []).length > 0 && (
          <Section icon={Sun} title="A real day">
            <ul className="list-disc space-y-0.5 pl-5">{p.aDay.map((d) => <li key={d}>{d}</li>)}</ul>
          </Section>
        )}
        {(p.challenges ?? []).length > 0 && (
          <Section icon={Mountain} title="Honestly, the hard parts">
            <ul className="list-disc space-y-0.5 pl-5">{p.challenges.map((d) => <li key={d}>{d}</li>)}</ul>
          </Section>
        )}
        <Section icon={Users} title="Team">{p.team}</Section>
        {p.growth && <Section icon={Sprout} title="What you will learn">{p.growth}</Section>}
        <Section icon={Languages} title="Languages">{p.languageNote}</Section>
        {p.relocationSupport && <Section icon={Plane} title="Moving to Finland">{p.relocationSupport}</Section>}
      </div>
      <Section icon={ListOrdered} title="Hiring steps">
        <ol className="flex flex-wrap gap-2">{p.process.map((s, i) => <li key={s} className="rounded-full bg-soft px-3 py-1 text-sm"><b>{i + 1}.</b> {s}</li>)}</ol>
      </Section>
      <p className="text-sm text-muted">{p.inclusionStatement}</p>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof Check; title: string; children: React.ReactNode }) {
  return (
    <div className="text-sm">
      <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted"><Icon className="size-3.5" />{title}</h3>
      <div>{children}</div>
    </div>
  );
}
