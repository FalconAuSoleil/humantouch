const API = "https://api.elevenlabs.io/v1";

function key() {
  const k = process.env.ELEVENLABS_API_KEY;
  if (!k) throw new Error("ELEVENLABS_API_KEY is not set");
  return k;
}

export async function textToSpeech(text: string): Promise<ArrayBuffer> {
  const voice = process.env.ELEVENLABS_VOICE_ID || "JBFqnCBsd6RMkjVDRZzb";
  const res = await fetch(`${API}/text-to-speech/${voice}?output_format=mp3_44100_64`, {
    method: "POST",
    headers: { "xi-api-key": key(), "content-type": "application/json" },
    body: JSON.stringify({ text: text.slice(0, 1200), model_id: process.env.ELEVENLABS_TTS_MODEL || "eleven_flash_v2_5", voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
  });
  if (!res.ok) throw new Error(`ElevenLabs TTS ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.arrayBuffer();
}

export async function speechToText(audio: Blob, keyterms: string[] = []): Promise<string> {
  const form = new FormData();
  form.append("model_id", "scribe_v2");
  form.append("language_code", "en");
  form.append("tag_audio_events", "false");
  // Bias recognition towards the person's own words: project names, tools, companies.
  const clean = [...new Set(keyterms.map((k) => k.replace(/[<>{}\[\]\\]/g, "").trim()).filter((k) => k.length > 1 && k.length <= 50 && k.split(/\s+/).length <= 5))].slice(0, 150);
  for (const k of clean) form.append("keyterms", k);
  form.append("file", audio, "answer.webm");
  const res = await fetch(`${API}/speech-to-text`, { method: "POST", headers: { "xi-api-key": key() }, body: form });
  if (!res.ok) throw new Error(`ElevenLabs STT ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as { text?: string };
  return (json.text ?? "").trim();
}
