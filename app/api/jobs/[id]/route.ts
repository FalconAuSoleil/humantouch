import { getJob } from "@/lib/db";
import { handle } from "@/lib/http";

export async function GET(_req: Request, ctx: RouteContext<"/api/jobs/[id]">) {
  const { id } = await ctx.params;
  return handle(async () => {
    const j = await getJob(id);
    if (!j) throw new Error("Job not found");
    return j;
  });
}
