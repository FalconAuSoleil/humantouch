"use client";
import { Check, Eye, Filter, Hash, HeartHandshake, Mountain, Search, ShieldCheck, Sparkles, Sun, Trophy, UserRound, X } from "lucide-react";
import { Card, cx } from "@/components/ui";
import { JOB_RULES } from "@/lib/prompts/guide-job";

type Technique = { icon: typeof Hash; title: string; ask: string; why: string };

const SEEKER: Technique[] = [
  { icon: Search, title: "Only what your CV doesn't say", ask: "Your CV says \"shop manager\". How many people were in your team?", why: "It reads your CV first and never asks what is already written." },
  { icon: Hash, title: "The number behind the claim", ask: "You said sales went up. By how much, roughly?", why: "\"It went well\" becomes something an employer can picture." },
  { icon: UserRound, title: "You, not the team", ask: "You said \"we\" opened the new store. What did you do yourself?", why: "It brings out your own part, not just the team's." },
  { icon: Trophy, title: "The moment you're proud of", ask: "Which moment at the hospital are you proudest of, and why?", why: "Only you can answer this. It is what makes a profile human." },
  { icon: HeartHandshake, title: "What people come to you for", ask: "When a customer is upset, what do colleagues ask you to do?", why: "It shows how you work with people, not just what you know." },
  { icon: Sparkles, title: "Questions from your job", ask: "As a nurse, how many patients did you look after per shift?", why: "A nurse, a cook or a developer each get the questions their job needs." },
];

const EMPLOYER: Technique[] = [
  { icon: Filter, title: "The superhero triage", ask: "You listed 10 skills. If you could keep only 3, which ones?", why: "Employers often ask for a superhero. In reality, 3 to 5 skills decide success, and long lists scare good people away." },
  { icon: ShieldCheck, title: "Proof, not diplomas", ask: "Instead of \"5 years of experience\", what would convince you someone can do it?", why: "Years and diplomas are shortcuts. Asking for proof opens the door to more people." },
  { icon: Sun, title: "A real day", ask: "What does a normal day look like in your bakery?", why: "People recognise themselves in real moments, not in lists of duties." },
  { icon: Mountain, title: "The honest hard part", ask: "What's the hardest part of this job?", why: "Being honest up front builds trust, and people stay longer." },
  { icon: HeartHandshake, title: "Why you'd love it", ask: "Why would you love this job if you were applying?", why: "The manager's own words: the human side of the job post." },
  { icon: Eye, title: "No hidden barriers", ask: "Is Finnish really needed for this job?", why: "Salary, language and working hours said clearly, so nobody has to guess." },
];

const PASSPORT_RULES = [
  "A headline that matches the target job",
  "A summary readable in 30 seconds",
  "Each experience tells a problem solved",
  "Give the scale in numbers",
  "At least one measured result per experience",
  "Name the people you worked with",
  "Precise action verbs",
  "Short bullets, one idea each",
  "Recent first, in detail",
  "Show transferable skills",
  "One language, no jargon",
  "Skills over pedigree",
];

function Column({ side, title, items }: { side: "cand" | "emp"; title: string; items: Technique[] }) {
  return (
    <div className="space-y-3">
      <h2 className={cx("text-xl font-extrabold", side === "cand" ? "text-cand" : "text-emp")}>{title}</h2>
      {items.map(({ icon: Icon, title: t, ask, why }) => (
        <Card key={t} className="p-4">
          <div className="flex items-start gap-3">
            <span className={cx("flex size-10 shrink-0 items-center justify-center rounded-xl", side === "cand" ? "bg-cand-soft text-cand" : "bg-emp-soft text-emp")}><Icon className="size-5" /></span>
            <div className="min-w-0">
              <h3 className="font-bold">{t}</h3>
              <p className={cx("mt-2 rounded-2xl rounded-bl-sm px-3 py-2 text-sm text-ink", side === "cand" ? "bg-cand-soft" : "bg-emp-soft")}>“{ask}”</p>
              <p className="mt-2 text-xs text-muted">{why}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function HowItWorks() {

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <section className="space-y-6">
        <div className="text-center">
          <p className="eyebrow emp justify-center">The problem</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight">Today, AI makes everyone <span className="text-emp">sound the same</span></h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted">
            People type &quot;write my CV&quot; or &quot;write a job post&quot; and let the AI do the rest. The AI gets no real facts, so it fills the gaps with generic words.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-emp/30 p-6">
            <p className="text-sm font-bold uppercase tracking-wider text-emp">Lazy AI</p>
            <p className="mt-3 rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-2.5 text-sm text-muted">&ldquo;Write me a CV for a project manager job.&rdquo;</p>
            <ul className="mt-4 space-y-2 text-sm text-ink">
              <li className="flex gap-2"><X className="mt-0.5 size-4 shrink-0 text-emp" />Every CV sounds the same, no real numbers</li>
              <li className="flex gap-2"><X className="mt-0.5 size-4 shrink-0 text-emp" />Job posts ask for a superhero with 12 skills</li>
              <li className="flex gap-2"><X className="mt-0.5 size-4 shrink-0 text-emp" />Recruiters can&apos;t tell who really fits</li>
            </ul>
            <p className="mt-4 rounded-xl bg-emp-soft/60 p-3 text-sm font-semibold text-emp-dark">Hiring gets slower and harder for everyone.</p>
          </Card>
          <Card className="border-cand/30 p-6">
            <p className="text-sm font-bold uppercase tracking-wider text-cand">HumanTouch</p>
            <p className="mt-3 rounded-2xl rounded-bl-sm bg-cand-soft px-4 py-2.5 text-sm text-ink">&ldquo;You said sales went up. By how much? And what did you do yourself?&rdquo;</p>
            <ul className="mt-4 space-y-2 text-sm text-ink">
              <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-cand" />The AI asks first, then writes</li>
              <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-cand" />Your real numbers and your own words</li>
              <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-cand" />Only the 3 to 5 skills that truly matter</li>
            </ul>
            <p className="mt-4 rounded-xl bg-cand-soft/60 p-3 text-sm font-semibold text-cand-dark">The right people recognise each other faster.</p>
          </Card>
        </div>
      </section>

      <div className="text-center">
        <p className="eyebrow justify-center">Our answer</p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight">The right questions bring out <span className="text-cand">the human touch</span></h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted">
          Our AI knows what makes a great CV and a great job offer. It asks you the right questions, so your own story comes through.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Column side="cand" title="With job seekers" items={SEEKER} />
        <Column side="emp" title="With employers" items={EMPLOYER} />
      </div>


      <section className="space-y-5">
        <div className="text-center">
          <p className="eyebrow justify-center">Human in the loop</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight">AI helps. <span className="text-cand">People decide.</span></h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted">
            The EU AI Act treats AI in recruitment as high risk. HumanTouch is built so a person stays in charge at every step.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Sparkles, title: "AI suggests", text: "On request, the AI checks the evidence in a profile, line by line, with a quote." },
            { icon: UserRound, title: "The recruiter scores", text: "The recruiter confirms or corrects each line. The score comes from their choices." },
            { icon: Eye, title: "The candidate sees why", text: "Candidates see the assessment and the reason for any \"not now\", and can add context." },
            { icon: ShieldCheck, title: "Nothing automatic", text: "No automatic rejection. Every decision is a human click, logged with its time." },
          ].map(({ icon: Icon, title, text }) => (
            <Card key={title} className="p-5">
              <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-cand-soft text-cand"><Icon className="size-5" /></span>
              <h3 className="font-bold">{title}</h3>
              <p className="mt-1 text-sm text-muted">{text}</p>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h3 className="mb-3 font-bold text-cand">The 12 golden rules of a great profile</h3>
          <ol className="list-decimal space-y-1 pl-5 text-sm">{PASSPORT_RULES.map((r) => <li key={r}>{r}</li>)}</ol>
        </Card>
        <Card>
          <h3 className="mb-3 font-bold text-emp">The {JOB_RULES.length} golden rules of a great job offer</h3>
          <ol className="list-decimal space-y-1 pl-5 text-sm">{JOB_RULES.map((r) => <li key={r.id}>{r.label}</li>)}</ol>
        </Card>
      </div>

    </div>
  );
}
