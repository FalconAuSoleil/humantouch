import { adoptCandidate, adoptJob, getCandidate, getJob } from "@/lib/db";
import { handle } from "@/lib/http";
import { signedUrl } from "@/lib/voice-agent";
import { candidateVariables, jobVariables } from "@/lib/voice-session";

// Opens a realtime voice session: a signed URL (the API key stays here) plus the dynamic variables.
export async function POST(req: Request) {
  return handle(async () => {
    const { kind, id, snapshot } = (await req.json()) as { kind: "c" | "j"; id: string; snapshot?: unknown };
    if (kind === "c") await adoptCandidate(snapshot);
    else await adoptJob(snapshot);
    const record = kind === "c" ? await getCandidate(id) : await getJob(id);
    if (!record?.brief) throw new Error("Interview not prepared");
    const dynamicVariables = kind === "c" ? candidateVariables(record as never) : jobVariables(record as never);
    return { signedUrl: await signedUrl(), dynamicVariables };
  });
}
