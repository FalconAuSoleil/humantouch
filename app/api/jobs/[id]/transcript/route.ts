import { adoptJob, updateJob } from "@/lib/db";
import { handle } from "@/lib/http";
import { cleanTranscript } from "@/lib/transcript";

export async function POST(req: Request, ctx: RouteContext<"/api/jobs/[id]/transcript">) {
  const { id } = await ctx.params;
  return handle(async () => {
    const body = await req.json();
    await adoptJob(body.snapshot);
    const interview = cleanTranscript(body);
    return updateJob(id, (j) => { j.interview = interview; });
  });
}
