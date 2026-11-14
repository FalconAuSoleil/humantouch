import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { AiCall, Application, Candidate, Job } from "./types";

// A single JSON file is enough for a demo on one machine. All writes go through one queue.
type Db = {
  candidates: Candidate[];
  jobs: Job[];
  applications: Application[];
  aiLog: AiCall[];
};

// Storage: Upstash Redis when its env vars exist (shared by all Vercel instances), otherwise a file:
// /tmp on Vercel (ephemeral, per instance), .data/ locally.
const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const REDIS_KEY = "humantouch:db";
const FILE = process.env.VERCEL ? "/tmp/humantouch-db.json" : path.join(process.cwd(), ".data", "db.json");
let cache: Db | null = null;
let queue: Promise<unknown> = Promise.resolve();

async function redis(command: unknown[]) {
  const res = await fetch(REDIS_URL!, {
    method: "POST",
    headers: { authorization: `Bearer ${REDIS_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Redis ${res.status}`);
  return ((await res.json()) as { result: unknown }).result;
}

async function fetchStored(): Promise<Db | null> {
  if (REDIS_URL && REDIS_TOKEN) {
    const raw = (await redis(["GET", REDIS_KEY])) as string | null;
    return raw ? (JSON.parse(raw) as Db) : null;
  }
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as Db;
  } catch {
    return null;
  }
}

async function load(): Promise<Db> {
  // With Redis another instance may have written: always read fresh.
  if (cache && !REDIS_URL) return cache;
  let db = await fetchStored();
  if (!db) {
    const { seedApplications, seedCandidates, seedJobs } = await import("./seed");
    db = { candidates: seedCandidates(), jobs: seedJobs(), applications: seedApplications(), aiLog: [] };
    await save(db);
  }
  cache = db;
  return db;
}

async function save(db: Db) {
  if (REDIS_URL && REDIS_TOKEN) {
    await redis(["SET", REDIS_KEY, JSON.stringify(db)]);
    return;
  }
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db));
  await fs.rename(tmp, FILE);
}

export async function read<T>(fn: (db: Db) => T): Promise<T> {
  return fn(await load());
}

export function write<T>(fn: (db: Db) => T): Promise<T> {
  const run = queue.then(async () => {
    const db = await load();
    const out = fn(db);
    await save(db);
    return out;
  });
  queue = run.catch(() => undefined);
  return run;
}

export const newId = () => randomUUID().slice(0, 8);

export async function getCandidate(id: string) {
  return read((db) => db.candidates.find((c) => c.id === id) ?? null);
}

export async function updateCandidate(id: string, fn: (c: Candidate) => void) {
  return write((db) => {
    const c = db.candidates.find((x) => x.id === id);
    if (!c) throw new Error("Candidate not found");
    fn(c);
    return c;
  });
}

export async function getJob(id: string) {
  return read((db) => db.jobs.find((j) => j.id === id) ?? null);
}

export async function updateJob(id: string, fn: (j: Job) => void) {
  return write((db) => {
    const j = db.jobs.find((x) => x.id === id);
    if (!j) throw new Error("Job not found");
    fn(j);
    return j;
  });
}

export async function logAiCall(call: Omit<AiCall, "at">) {
  await write((db) => {
    db.aiLog.unshift({ at: new Date().toISOString(), ...call });
    db.aiLog = db.aiLog.slice(0, 100);
  });
}

// Without a shared store (Upstash), Vercel instances do not share /tmp: the browser keeps a copy of the
// person's own record and sends it back with each step. The most advanced copy wins, so a stale instance
// can never roll a flow back.
export function candidateProgress(c: Candidate) {
  const stage = { new: 0, extracted: 1, interview: 2, passport: 3 }[c.status] ?? 0;
  return stage * 10_000 + (c.brief ? 1000 : 0) + c.interview.turns.length * 2 + (c.visible ? 1 : 0);
}

export function jobProgress(j: Job) {
  return (j.status === "published" ? 30_000 : j.posting ? 20_000 : j.brief ? 10_000 : 0) + j.interview.turns.length;
}

export async function adoptCandidate(snapshot: unknown) {
  const c = snapshot as Candidate | undefined;
  if (!c || typeof c.id !== "string" || !c.interview) return;
  await write((db) => {
    const i = db.candidates.findIndex((x) => x.id === c.id);
    if (i < 0) db.candidates.unshift(c);
    else if (candidateProgress(c) > candidateProgress(db.candidates[i])) db.candidates[i] = c;
  });
}

export async function adoptJob(snapshot: unknown) {
  const j = snapshot as Job | undefined;
  if (!j || typeof j.id !== "string" || !j.interview) return;
  await write((db) => {
    const i = db.jobs.findIndex((x) => x.id === j.id);
    if (i < 0) db.jobs.unshift(j);
    else if (jobProgress(j) > jobProgress(db.jobs[i])) db.jobs[i] = j;
  });
}

export async function adoptApplication(snapshot: unknown) {
  const a = snapshot as Application | undefined;
  if (!a || typeof a.id !== "string" || !a.jobId) return;
  await write((db) => {
    const i = db.applications.findIndex((x) => x.id === a.id);
    if (i < 0) db.applications.unshift(a);
    else if ((a.log?.length ?? 0) > (db.applications[i].log?.length ?? 0)) db.applications[i] = a;
  });
}

export async function updateApplication(id: string, fn: (a: Application) => void) {
  return write((db) => {
    const a = db.applications.find((x) => x.id === id);
    if (!a) throw new Error("Application not found");
    fn(a);
    return a;
  });
}
