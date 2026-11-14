import { adoptApplication, newId, read, write } from "@/lib/db";
import { handle } from "@/lib/http";
import { logEntry } from "@/lib/review";
import type { Application } from "@/lib/types";

const SLOTS = ["Espoo Talent Day, Fri 21 Nov, 10:00", "Espoo Talent Day, Fri 21 Nov, 11:30", "Espoo Talent Day, Fri 21 Nov, 14:00", "Online, Mon 24 Nov, 15:00"];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const candidateId = url.searchParams.get("candidateId");
  return handle(() => read((db) => db.applications.filter((a) => !candidateId || a.candidateId === candidateId)));
}

export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as { candidateId: string; jobId: string; note?: string; by: "candidate" | "employer"; snapshot?: unknown };
    await adoptApplication(body.snapshot);
    return write((db) => {
      const existing = db.applications.find((a) => a.candidateId === body.candidateId && a.jobId === body.jobId);
      if (existing) {
        // An employer invitation the candidate answers by applying counts as accepted.
        if (body.by === "candidate" && existing.status === "invited") {
          existing.status = "accepted";
          existing.log = [...(existing.log ?? []), logEntry("candidate", "Accepted the invitation")];
        }
        if (body.by === "employer" && existing.status === "applied") {
          existing.status = "accepted";
          existing.slot ??= SLOTS[db.applications.length % SLOTS.length];
          existing.log = [...(existing.log ?? []), logEntry("recruiter", "Invited to talk")];
        }
        return existing;
      }
      const a: Application = {
        id: newId(), candidateId: body.candidateId, jobId: body.jobId, initiatedBy: body.by, note: (body.note ?? "").slice(0, 600),
        status: body.by === "candidate" ? "applied" : "invited", createdAt: new Date().toISOString(),
        slot: body.by === "employer" ? SLOTS[db.applications.length % SLOTS.length] : undefined,
        log: [logEntry(body.by === "candidate" ? "candidate" : "recruiter", body.by === "candidate" ? "Applied" : "Invited to talk")],
      };
      db.applications.unshift(a);
      return a;
    });
  });
}
