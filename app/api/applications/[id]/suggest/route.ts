import { adoptApplication, adoptCandidate, adoptJob, getCandidate, getJob, read, updateApplication } from "@/lib/db";
import { handle } from "@/lib/http";
import { logEntry, suggestFit } from "@/lib/review";

export const maxDuration = 300;

// Only on the recruiter's request: the AI suggests an evidence check per requirement. It decides nothing.
export async function POST(req: Request, ctx: RouteContext<"/api/applications/[id]/suggest">) {
  const { id } = await ctx.params;
  return handle(async () => {
    const body = (await req.json()) as { application?: unknown; candidate?: unknown; job?: unknown };
    await Promise.all([adoptApplication(body.application), adoptCandidate(body.candidate), adoptJob(body.job)]);
    const a = await read((db) => db.applications.find((x) => x.id === id));
    if (!a) throw new Error("Application not found");
    const [c, j] = await Promise.all([getCandidate(a.candidateId), getJob(a.jobId)]);
    if (!c?.passport || !j?.posting) throw new Error("Passport or job post missing");
    const aiCheck = await suggestFit(c, j);
    return updateApplication(id, (x) => {
      x.aiCheck = aiCheck;
      x.log = [...(x.log ?? []), logEntry("ai", "Suggested an evidence check", "Suggestion only, to be confirmed by the recruiter")];
    });
  });
}
