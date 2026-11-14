"use client";
import { Check } from "lucide-react";
import type { BriefQuestion } from "@/lib/types";
import { cx } from "./ui";

type Step = { key: string; label: string; total: number; covered: number };

const pretty = (key: string) => (/^exp\d+$/.test(key) ? `Experience ${key.slice(3)}` : key.charAt(0).toUpperCase() + key.slice(1));

/** Slim progress: one segment per experience or section, filling as its questions are covered. */
export function Ladder({ questions, covered, names }: { questions: BriefQuestion[]; covered: string[]; names: Record<string, string> }) {
  const steps: Step[] = [];
  for (const q of questions) {
    const key = q.expRef ?? "general";
    let s = steps.find((x) => x.key === key);
    if (!s) {
      s = { key, label: key === "general" ? "About you" : names[key] ?? pretty(key), total: 0, covered: 0 };
      steps.push(s);
    }
    s.total++;
    if (covered.includes(q.id)) s.covered++;
  }
  const general = steps.findIndex((s) => s.key === "general");
  if (general >= 0) steps.push(steps.splice(general, 1)[0]);
  const active = steps.findIndex((s) => s.covered < s.total);

  return (
    <div className="flex gap-2">
      {steps.map((s, i) => {
        const done = s.covered >= s.total;
        return (
          <div key={s.key} className="min-w-0 flex-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-gradient-to-r from-cand to-rose transition-all duration-700" style={{ width: `${(100 * s.covered) / Math.max(1, s.total)}%` }} />
            </div>
            <p className={cx("mt-1.5 flex items-center gap-1 truncate text-xs", i === active ? "font-semibold text-ink" : done ? "text-cand" : "text-muted")}>
              {done && <Check className="size-3 shrink-0" />}
              <span className="truncate">{s.label}</span>
            </p>
          </div>
        );
      })}
    </div>
  );
}
