import { speechToText } from "@/lib/elevenlabs";
import { handle } from "@/lib/http";

export async function POST(req: Request) {
  return handle(async () => {
    const form = await req.formData();
    const file = form.get("audio");
    if (!(file instanceof Blob)) throw new Error("No audio");
    let keyterms: string[] = [];
    try {
      keyterms = JSON.parse(String(form.get("keyterms") ?? "[]"));
    } catch {
      /* no keyterms */
    }
    return { text: await speechToText(file, Array.isArray(keyterms) ? keyterms.map(String) : []) };
  });
}
