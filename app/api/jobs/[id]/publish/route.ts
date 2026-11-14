import { adoptJob, updateJob } from "@/lib/db";
import { handle } from "@/lib/http";

export async function POST(req: Request, ctx: RouteContext<"/api/jobs/[id]/publish">) {
  const { id } = await ctx.params;
  return handle(async () => {
    const { snapshot } = (await req.json().catch(() => ({}))) as { snapshot?: unknown };
    await adoptJob(snapshot);
    return updateJob(id, (j) => { if (j.posting) j.status = "published"; });
  });
}
