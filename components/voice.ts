"use client";
import { useCallback, useEffect, useRef, useState } from "react";

const SILENCE_MS = 1500; // pause that ends an answer
const MAX_ANSWER_MS = 90_000;

/**
 * ElevenLabs voice, hands-free: TTS speaks the question, then the mic listens and a simple voice
 * activity detector ends the answer after a pause; Scribe transcribes it with the person's own terms.
 */
export function useVoice() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speakDone = useRef<(() => void) | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const abortListen = useRef<(() => void) | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [level, setLevel] = useState(0);

  const stopSpeaking = useCallback(() => {
    audioRef.current?.pause();
    setSpeaking(false);
    speakDone.current?.();
    speakDone.current = null;
  }, []);

  /** Speaks and resolves when the audio ends (or is stopped). */
  const speak = useCallback(async (text: string) => {
    stopSpeaking();
    try {
      const res = await fetch("/api/voice/tts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) });
      if (!res.ok) return;
      const audio = new Audio(URL.createObjectURL(await res.blob()));
      audioRef.current = audio;
      setSpeaking(true);
      await new Promise<void>((resolve) => {
        speakDone.current = resolve;
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        audio.play().catch(() => resolve());
      });
    } finally {
      setSpeaking(false);
      speakDone.current = null;
    }
  }, [stopSpeaking]);

  const micStream = useCallback(async () => {
    if (streamRef.current?.active) return streamRef.current;
    streamRef.current = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
    });
    return streamRef.current;
  }, []);

  const transcribe = useCallback(async (blob: Blob, keyterms: string[]) => {
    setTranscribing(true);
    try {
      const form = new FormData();
      form.append("audio", blob, "answer.webm");
      form.append("keyterms", JSON.stringify(keyterms));
      const res = await fetch("/api/voice/stt", { method: "POST", body: form });
      const json = await res.json();
      return (json.text as string | undefined)?.trim() ?? "";
    } finally {
      setTranscribing(false);
    }
  }, []);

  /**
   * Listens until the person has spoken and then paused. Resolves with the transcript,
   * or "" when stopped (mute, pause) or when nothing was said.
   */
  const listen = useCallback(async (keyterms: string[] = []): Promise<string> => {
    const stream = await micStream();
    const ctx = ctxRef.current ?? new AudioContext();
    ctxRef.current = ctx;
    if (ctx.state === "suspended") await ctx.resume();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);
    const buf = new Float32Array(analyser.fftSize);

    const rec = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.start(250);
    setRecording(true);

    const spoke = await new Promise<boolean>((resolve) => {
      let floor = 0.01;
      let calibrated = 0;
      let speechStart = 0;
      let lastVoice = 0;
      const started = performance.now();
      const timer = setInterval(() => {
        analyser.getFloatTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        const rms = Math.sqrt(sum / buf.length);
        setLevel(Math.min(1, rms * 12));
        const now = performance.now();
        if (calibrated < 6) {
          floor = Math.max(floor, rms); // first ~300 ms: room noise
          calibrated++;
          return;
        }
        const threshold = Math.max(0.015, floor * 2.5);
        if (rms > threshold) {
          if (!speechStart) speechStart = now;
          lastVoice = now;
        }
        const longEnough = speechStart && lastVoice - speechStart > 300;
        if ((longEnough && now - lastVoice > SILENCE_MS) || now - started > MAX_ANSWER_MS) finish(!!longEnough);
      }, 50);
      const finish = (ok: boolean) => {
        clearInterval(timer);
        abortListen.current = null;
        resolve(ok);
      };
      abortListen.current = () => finish(false);
    });

    const stopped = new Promise<void>((r) => (rec.onstop = () => r()));
    rec.stop();
    await stopped;
    source.disconnect();
    setRecording(false);
    setLevel(0);
    if (!spoke) return "";
    return transcribe(new Blob(chunks, { type: rec.mimeType || "audio/webm" }), keyterms);
  }, [micStream, transcribe]);

  const stopListening = useCallback(() => abortListen.current?.(), []);

  useEffect(() => () => {
    abortListen.current?.();
    audioRef.current?.pause();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    ctxRef.current?.close().catch(() => undefined);
  }, []);

  return { speak, stopSpeaking, listen, stopListening, speaking, recording, transcribing, level };
}
