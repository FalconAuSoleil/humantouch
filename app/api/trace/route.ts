import { read } from "@/lib/db";
import { handle } from "@/lib/http";
import { MODEL } from "@/lib/nemotron";

export async function GET() {
  return handle(() => read((db) => ({ model: MODEL, calls: db.aiLog })));
}
