import { textToSpeech } from "@/lib/elevenlabs";
import { ok } from "@/lib/http";

export async function POST(req: Request) {
  try {
    const { text } = (await req.json()) as { text: string };
    const audio = await textToSpeech(text);
    return new Response(audio, { headers: { "content-type": "audio/mpeg", "cache-control": "no-store" } });
  } catch (e) {
    return ok({ error: (e as Error).message }, 500);
  }
}
