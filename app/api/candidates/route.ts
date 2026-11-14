import { newId, read, write } from "@/lib/db";
import { handle } from "@/lib/http";
import type { Candidate } from "@/lib/types";

export async function GET() {
  return handle(() =>
    read((db) =>
      db.candidates.map((c) => ({ id: c.id, firstName: c.firstName, status: c.status, headline: c.passport?.headline ?? c.profile?.headline ?? null, seed: !!c.seed, visible: c.visible })),
    ),
  );
}

export async function POST(req: Request) {
  return handle(async () => {
    const { firstName } = (await req.json()) as { firstName: string };
    const c: Candidate = {
      id: newId(), firstName: (firstName || "Friend").trim().slice(0, 40), createdAt: new Date().toISOString(), status: "new",
      sources: [], interview: { turns: [], facts: [], covered: [], done: false }, visible: false,
    };
    await write((db) => { db.candidates.unshift(c); });
    return c;
  });
}
