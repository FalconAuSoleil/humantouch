import { hasNvidiaKey, MODEL, provider } from "@/lib/nemotron";
import { ok } from "@/lib/http";

export async function GET() {
  return ok({ realtime: Boolean(process.env.ELEVENLABS_AGENT_ID && process.env.ELEVENLABS_API_KEY), provider: provider(), nvidia: hasNvidiaKey(), elevenlabs: Boolean(process.env.ELEVENLABS_API_KEY), model: MODEL });
}
