import { adoptCandidate, updateCandidate } from "@/lib/db";
import { handle } from "@/lib/http";

export async function POST(req: Request, ctx: RouteContext<"/api/candidates/[id]/publish">) {
  const { id } = await ctx.params;
  return handle(async () => {
    const { visible, snapshot } = (await req.json()) as { visible: boolean; snapshot?: unknown };
    await adoptCandidate(snapshot);
    return updateCandidate(id, (c) => { c.visible = !!visible && !!c.passport; });
  });
}
