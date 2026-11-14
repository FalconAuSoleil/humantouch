import { write } from "@/lib/db";
import { handle } from "@/lib/http";
import type { Application } from "@/lib/types";

export async function PATCH(req: Request, ctx: RouteContext<"/api/applications/[id]">) {
  const { id } = await ctx.params;
  return handle(async () => {
    const { status } = (await req.json()) as { status: Application["status"] };
    return write((db) => {
      const a = db.applications.find((x) => x.id === id);
      if (!a) throw new Error("Application not found");
      a.status = status;
      return a;
    });
  });
}
