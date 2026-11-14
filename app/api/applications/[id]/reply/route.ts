import { adoptApplication, updateApplication } from "@/lib/db";
import { handle } from "@/lib/http";
import { logEntry } from "@/lib/review";

// The candidate sees the assessment and can add context: the right to an explanation and to respond.
export async function POST(req: Request, ctx: RouteContext<"/api/applications/[id]/reply">) {
  const { id } = await ctx.params;
  return handle(async () => {
    const { text, application } = (await req.json()) as { text: string; application?: unknown };
    await adoptApplication(application);
    if (!text?.trim()) throw new Error("Empty reply");
    return updateApplication(id, (a) => {
      a.reply = text.trim().slice(0, 800);
      a.log = [...(a.log ?? []), logEntry("candidate", "Added context", a.reply)];
    });
  });
}
