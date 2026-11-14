import { interviewTurn } from "@/lib/candidate";
import { adoptCandidate } from "@/lib/db";
import { handle } from "@/lib/http";

export const maxDuration = 300;

export async function POST(req: Request, ctx: RouteContext<"/api/candidates/[id]/interview">) {
  const { id } = await ctx.params;
  return handle(async () => {
    const { answer, snapshot } = (await req.json().catch(() => ({}))) as { answer?: string; snapshot?: unknown };
    await adoptCandidate(snapshot);
    return interviewTurn(id, answer ?? null);
  });
}
