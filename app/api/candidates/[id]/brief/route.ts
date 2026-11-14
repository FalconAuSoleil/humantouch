import { prepareBrief } from "@/lib/candidate";
import { adoptCandidate } from "@/lib/db";
import { handle } from "@/lib/http";

export const maxDuration = 300;

export async function POST(req: Request, ctx: RouteContext<"/api/candidates/[id]/brief">) {
  const { id } = await ctx.params;
  return handle(async () => {
    const { snapshot } = (await req.json().catch(() => ({}))) as { snapshot?: unknown };
    await adoptCandidate(snapshot);
    return prepareBrief(id);
  });
}
