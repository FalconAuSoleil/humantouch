import { getCandidate } from "@/lib/db";
import { handle } from "@/lib/http";

export async function GET(_req: Request, ctx: RouteContext<"/api/candidates/[id]">) {
  const { id } = await ctx.params;
  return handle(async () => {
    const c = await getCandidate(id);
    if (!c) throw new Error("Candidate not found");
    return c;
  });
}
