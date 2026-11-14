import { adoptJob } from "@/lib/db";
import { handle } from "@/lib/http";
import { writePosting } from "@/lib/job";

export const maxDuration = 300;

export async function POST(req: Request, ctx: RouteContext<"/api/jobs/[id]/write">) {
  const { id } = await ctx.params;
  return handle(async () => {
    const { snapshot } = (await req.json().catch(() => ({}))) as { snapshot?: unknown };
    await adoptJob(snapshot);
    return writePosting(id);
  });
}
