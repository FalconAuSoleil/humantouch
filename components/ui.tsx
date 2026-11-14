"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Check, ChevronDown, Cpu, Loader2, Sparkles } from "lucide-react";

export type Side = "cand" | "emp";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export function Button({
  children, onClick, href, side = "cand", variant = "solid", disabled, loading, size = "md", type = "button",
}: {
  children: ReactNode; onClick?: () => void; href?: string; side?: Side; variant?: "solid" | "ghost" | "outline";
  disabled?: boolean; loading?: boolean; size?: "md" | "lg" | "sm"; type?: "button" | "submit";
}) {
  const color =
    variant === "solid"
      ? side === "cand" ? "bg-cand text-white hover:bg-cand-dark" : "bg-emp text-white hover:bg-emp-dark"
      : variant === "outline"
        ? side === "cand" ? "border border-cand bg-white text-cand hover:bg-cand-soft" : "border border-emp bg-white text-emp hover:bg-emp-soft"
        : side === "cand" ? "text-cand hover:bg-cand-soft" : "text-emp hover:bg-emp-soft";
  const sz = size === "lg" ? "px-7 py-3.5 text-base" : size === "sm" ? "px-3.5 py-1.5 text-sm" : "px-5 py-2.5 text-sm";
  const cls = cx("inline-flex items-center justify-center gap-2 rounded-full font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed", color, sz);
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled || loading}>
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("rounded-2xl border border-line bg-white p-5", className)}>{children}</div>;
}

export function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "green" | "amber" | "red" | "cand" | "emp" | "nv" }) {
  const t = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-800",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-rose-100 text-rose-700",
    cand: "bg-cand-soft text-cand-dark",
    emp: "bg-emp-soft text-emp-dark",
    nv: "bg-lime-100 text-lime-800",
  }[tone];
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", t)}>{children}</span>;
}

export function scoreTone(score: number) {
  return score >= 75 ? "#5853ff" : score >= 50 ? "#ff2c9b" : "#a3a1b5";
}

export function scoreWord(score: number) {
  return score >= 75 ? "Strong match" : score >= 50 ? "Good potential" : "Partial match";
}

export function ScoreRing({ score, size = 72, label }: { score: number; size?: number; label?: string }) {
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  const color = scoreTone(score);
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} stroke="#eeecff" strokeWidth={6} fill="none" />
          <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={6} fill="none" strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} style={{ transition: "stroke-dashoffset 0.8s" }} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-extrabold text-ink" style={{ fontSize: size / 3.8 }}>{score}%</span>
      </div>
      {label && <span className="mt-1 text-xs font-semibold" style={{ color }}>{label}</span>}
    </div>
  );
}

export function Stepper({ steps, current, side = "cand" }: { steps: string[]; current: number; side?: Side }) {
  return (
    <ol className="flex flex-wrap items-center gap-2 text-sm">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s} className="flex items-center gap-2">
            <span className={cx(
              "flex size-7 items-center justify-center rounded-full text-xs font-bold",
              done ? (side === "cand" ? "bg-cand text-white" : "bg-emp text-white") : active ? (side === "cand" ? "bg-white text-cand ring-2 ring-cand" : "bg-white text-emp ring-2 ring-emp") : "bg-white text-slate-400 ring-1 ring-slate-300",
            )}>
              {done ? <Check className="size-4" /> : i + 1}
            </span>
            <span className={cx("font-medium", active ? "text-ink" : "text-muted")}>{s}</span>
            {i < steps.length - 1 && <span className="mx-1 h-px w-6 bg-line" />}
          </li>
        );
      })}
    </ol>
  );
}

/** Live checklist of AI steps, so people see what Nemotron is doing instead of a spinner. */
export function AiSteps({ steps, current, error }: { steps: string[]; current: number; error?: string | null }) {
  return (
    <ul className="space-y-2.5">
      {steps.map((s, i) => (
        <li key={s} className={cx("flex items-center gap-3 text-sm", i > current && "text-slate-400")}>
          {i < current ? (
            <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500 text-white"><Check className="size-3.5" /></span>
          ) : i === current && !error ? (
            <Loader2 className="size-6 animate-spin text-cand" />
          ) : (
            <span className="size-6 rounded-full border-2 border-slate-200" />
          )}
          <span className={cx(i === current && "font-semibold")}>{s}</span>
        </li>
      ))}
      {error && <li className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</li>}
    </ul>
  );
}

export function NemotronTag({ children = "Nemotron" }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-lime-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-lime-800">
      <Sparkles className="size-3" /> {children}
    </span>
  );
}

export function Header() {
  const path = usePathname();
  const [status, setStatus] = useState<{ nvidia: boolean; elevenlabs: boolean; provider: string } | null>(null);
  useEffect(() => {
    fetch("/api/status").then((r) => r.json()).then(setStatus).catch(() => undefined);
  }, []);
  const tab = (href: string, label: string, side: Side) => {
    const active = path.startsWith(href);
    return (
      <Link href={href} className={cx("rounded-full px-4 py-2 text-sm font-semibold transition",
        active ? (side === "cand" ? "bg-cand-soft text-cand-dark" : "bg-emp-soft text-emp-dark") : "text-muted hover:text-ink")}>
        {label}
      </Link>
    );
  };
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5 font-semibold text-ink">
          <Image src="/logo.svg" alt="" width={40} height={40} priority className="size-10" />
          <span className="text-lg">HumanTouch</span>
        </Link>
        <nav className="ml-auto flex items-center gap-1">
          {tab("/candidate", "Job seekers", "cand")}
          {tab("/employer", "Employers", "emp")}
          <Link href="/trace" className={cx("hidden items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold sm:flex", path.startsWith("/trace") ? "bg-lime-100 text-lime-800" : "text-muted hover:text-ink")}>
            <Cpu className="size-4" /> How it works
          </Link>
        </nav>
      </div>
      {status && status.provider !== "nemotron" && (
        <div className="bg-amber-100 px-4 py-1.5 text-center text-xs font-medium text-profond">
          {status.provider === "claude-cli"
            ? "Test mode: AI runs on the local claude CLI"
            : "Demo mode: AI not connected yet, demo profiles and jobs only"}
        </div>
      )}
    </header>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-muted">{children}</div>;
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 p-10 text-muted">
      <Loader2 className="size-5 animate-spin" /> {label}
    </div>
  );
}

/** Folded details: the screen shows the essentials, the reasons are one tap away. */
export function Details({ label = "Why?", children, side = "cand" }: { label?: string; children: ReactNode; side?: Side }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(!open)} className={cx("inline-flex items-center gap-1 text-sm font-semibold", side === "cand" ? "text-cand" : "text-emp")}>
        {open ? "Hide" : label}
        <ChevronDown className={cx("size-4 transition", open && "rotate-180")} />
      </button>
      {open && <div className="mt-3 fade-up">{children}</div>}
    </div>
  );
}
