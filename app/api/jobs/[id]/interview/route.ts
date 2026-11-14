import { adoptJob } from "@/lib/db";
import { handle } from "@/lib/http";
import { jobInterviewTurn } from "@/lib/job";

export const maxDuration = 300;

export async function POST(req: Request, ctx: RouteContext<"/api/jobs/[id]/interview">) {
  const { id } = await ctx.params;
  return handle(async () => {
    const { answer, snapshot } = (await req.json().catch(() => ({}))) as { answer?: string; snapshot?: unknown };
    await adoptJob(snapshot);
    return jobInterviewTurn(id, answer ?? null);
  });
}
