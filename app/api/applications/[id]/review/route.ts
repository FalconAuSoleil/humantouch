import { adoptApplication, updateApplication } from "@/lib/db";
import { handle } from "@/lib/http";
import { applyReview } from "@/lib/review";
import type { Application, ReqCheck } from "@/lib/types";

// The recruiter's assessment and decision: always a human action, with a reason when it is "not now".
export async function POST(req: Request, ctx: RouteContext<"/api/applications/[id]/review">) {
  const { id } = await ctx.params;
  return handle(async () => {
    const body = (await req.json()) as { checks: ReqCheck[]; decision?: Application["decision"]; reason?: string; application?: unknown };
    await adoptApplication(body.application);
    return updateApplication(id, (a) => { applyReview(a, body); });
  });
}
