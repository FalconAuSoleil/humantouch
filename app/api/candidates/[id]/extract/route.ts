import { extractProfile, type UploadedDoc } from "@/lib/candidate";
import { adoptCandidate } from "@/lib/db";
import { handle } from "@/lib/http";

export const maxDuration = 300;

export async function POST(req: Request, ctx: RouteContext<"/api/candidates/[id]/extract">) {
  const { id } = await ctx.params;
  return handle(async () => {
    const { docs, snapshot } = (await req.json()) as { docs: UploadedDoc[]; snapshot?: unknown };
    await adoptCandidate(snapshot);
    return extractProfile(id, docs ?? []);
  });
}
