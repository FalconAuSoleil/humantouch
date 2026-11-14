import { read } from "@/lib/db";
import { handle } from "@/lib/http";

// No AI ranking: every published job, newest first, with this candidate's application if any.
export async function GET(_req: Request, ctx: RouteContext<"/api/candidates/[id]/jobs">) {
  const { id } = await ctx.params;
  return handle(() =>
    read((db) =>
      db.jobs
        .filter((j) => j.status === "published" && j.posting)
        .map((j) => ({ job: { id: j.id, company: j.company, posting: j.posting! }, application: db.applications.find((a) => a.jobId === j.id && a.candidateId === id) ?? null })),
    ),
  );
}
