import { read } from "@/lib/db";
import { handle } from "@/lib/http";
import { createJob } from "@/lib/job";

export const maxDuration = 300;

export async function GET() {
  return handle(() =>
    read((db) =>
      db.jobs.map((j) => ({
        id: j.id, company: j.company, status: j.status, title: j.posting?.title ?? j.draft.title, seed: !!j.seed,
        quality: j.quality?.score ?? null, location: j.posting?.location ?? null, hasPosting: !!j.posting,
        applicants: db.applications.filter((a) => a.jobId === j.id && a.status !== "declined").length,
      })),
    ),
  );
}

export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as { company: string; title: string; text: string; images?: string[] };
    return createJob({ ...body, images: body.images ?? [] });
  });
}
