import { adoptCandidate, updateCandidate } from "@/lib/db";
import { handle } from "@/lib/http";
import { cleanTranscript } from "@/lib/transcript";

export async function POST(req: Request, ctx: RouteContext<"/api/candidates/[id]/transcript">) {
  const { id } = await ctx.params;
  return handle(async () => {
    const body = await req.json();
    await adoptCandidate(body.snapshot);
    const interview = cleanTranscript(body);
    return updateCandidate(id, (c) => { c.interview = interview; });
  });
}
