"use client";
import { useState } from "react";
import { CalendarCheck, Check, CircleDashed, Clock, Minus, Send, Star, UserRound } from "lucide-react";
import { api } from "./api";
import { saveSnapshot } from "./snapshot";
import { Button, Details, cx } from "./ui";
import type { Application } from "@/lib/types";

/** What the candidate sees: who decided what, why, and a way to add context (explanation and contest). */
export function ApplicationStatus({ application: a, onChange }: { application: Application; onChange: (a: Application) => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const status =
    a.status === "accepted" ? { icon: CalendarCheck, text: `Meeting booked · ${a.slot ?? ""}`, cls: "bg-emerald-50 text-emerald-800" }
    : a.status === "invited" ? { icon: CalendarCheck, text: `Invited to talk · ${a.slot ?? ""}`, cls: "bg-emerald-50 text-emerald-800" }
    : a.status === "declined" ? { icon: Minus, text: `Not now${a.reason ? `: ${a.reason}` : ""}`, cls: "bg-slate-100 text-ink" }
    : a.decision === "shortlist" ? { icon: Star, text: "Shortlisted by the recruiter", cls: "bg-emp-soft text-emp-dark" }
    : { icon: Clock, text: "A person is reviewing your application", cls: "bg-soft text-ink" };

  const reply = async () => {
    setBusy(true);
    try {
      const next = await api<Application>(`/api/applications/${a.id}/reply`, { text, application: a });
      saveSnapshot("a", next);
      onChange(next);
      setText("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 space-y-3 border-t border-line pt-4">
      <p className={cx("flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold", status.cls)}><status.icon className="size-4" />{status.text}</p>
      {a.checks && (
        <Details label="How the recruiter assessed you">
          <ul className="space-y-1 text-sm">
            {a.checks.map((c) => (
              <li key={c.skill} className="flex items-center gap-2">
                {c.status === "met" ? <Check className="size-4 text-emerald-600" /> : c.status === "partial" ? <CircleDashed className="size-4 text-amber-500" /> : <Minus className="size-4 text-slate-400" />}
                <span className="text-ink">{c.skill}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 flex items-center gap-1 text-xs text-muted"><UserRound className="size-3" /> Assessed by a person{typeof a.score === "number" ? ` · score ${a.score}` : ""}.</p>
          {a.reply ? (
            <p className="mt-3 rounded-xl bg-cand-soft/60 p-3 text-sm"><b>You added:</b> {a.reply}</p>
          ) : (
            <div className="mt-3 flex gap-2">
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Something missing? Add context for the recruiter"
                className="flex-1 rounded-[10px] border border-slate-300 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-cand" />
              <Button size="sm" onClick={reply} disabled={!text.trim()} loading={busy}><Send className="size-4" /></Button>
            </div>
          )}
        </Details>
      )}
    </div>
  );
}
