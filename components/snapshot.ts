"use client";
import { api } from "./api";
import type { Candidate, Job } from "@/lib/types";

// The browser keeps the person's own record so the flow survives Vercel instances without shared storage.
const key = (kind: "c" | "j" | "a", id: string) => `ht:${kind}:${id}`;

export function saveSnapshot(kind: "c" | "j" | "a", obj: { id: string }) {
  try {
    localStorage.setItem(key(kind, obj.id), JSON.stringify(obj));
    const list = JSON.parse(localStorage.getItem(`ht:${kind}:list`) ?? "[]") as string[];
    if (!list.includes(obj.id)) localStorage.setItem(`ht:${kind}:list`, JSON.stringify([obj.id, ...list].slice(0, 20)));
  } catch {
    /* storage unavailable: the server copy is used */
  }
}

export function snapshot<T>(kind: "c" | "j" | "a", id: string): T | undefined {
  try {
    const raw = localStorage.getItem(key(kind, id));
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
}

export function snapshotList<T>(kind: "c" | "j" | "a"): T[] {
  try {
    const list = JSON.parse(localStorage.getItem(`ht:${kind}:list`) ?? "[]") as string[];
    return list.map((id) => snapshot<T>(kind, id)).filter(Boolean) as T[];
  } catch {
    return [];
  }
}

/** Calls a step of the flow with the local copy attached, and stores the updated record it returns. */
export async function step<T extends { id: string }>(kind: "c" | "j" | "a", url: string, id: string, body: Record<string, unknown> = {}): Promise<T> {
  const out = await api<T>(url, { ...body, snapshot: snapshot(kind, id) });
  saveSnapshot(kind, out);
  return out;
}

// Same ranking as lib/db.ts: the most advanced copy of a record wins.
const candidateProgress = (c: Candidate) =>
  (({ new: 0, extracted: 1, interview: 2, passport: 3 } as Record<string, number>)[c.status] ?? 0) * 10_000 + (c.brief ? 1000 : 0) + c.interview.turns.length * 2 + (c.visible ? 1 : 0);
const jobProgress = (j: Job) => (j.status === "published" ? 30_000 : j.posting ? 20_000 : j.brief ? 10_000 : 0) + j.interview.turns.length;

async function load<T extends { id: string }>(kind: "c" | "j" | "a", url: string, id: string, rank: (x: T) => number): Promise<T> {
  const local = snapshot<T>(kind, id);
  const server = await api<T>(url).catch(() => undefined);
  const best = server && (!local || rank(server) > rank(local)) ? server : local;
  if (!best) throw new Error(kind === "c" ? "Profile not found" : "Job not found");
  saveSnapshot(kind, best);
  return best;
}

export const loadCandidate = (id: string) => load<Candidate>("c", `/api/candidates/${id}`, id, candidateProgress);
export const loadJob = (id: string) => load<Job>("j", `/api/jobs/${id}`, id, jobProgress);
