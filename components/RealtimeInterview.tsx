"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { Mic, MicOff, Pause, Play, PhoneOff } from "lucide-react";
import { api } from "./api";
import { snapshot } from "./snapshot";
import { AiSteps, Card, cx, type Side } from "./ui";
import { Orb } from "./Orb";
import { Ladder } from "./Ladder";
import type { BriefQuestion, Fact, Turn } from "@/lib/types";

/**
 * Realtime voice with an ElevenLabs agent (as in Smart Portfolio): audio streams both ways, the agent
 * detects the end of each turn itself, and updates the screen through client tools.
 */
type Props = {
  side: Side;
  kind: "c" | "j";
  id: string;
  title: string;
  questions: BriefQuestion[];
  names: Record<string, string>;
  onDone: (transcript: { turns: Turn[]; facts: Fact[]; covered: string[] }) => Promise<void>;
  finishSteps: string[];
};

const text = (v: unknown) => (typeof v === "string" ? v : "");

function Session({ side, kind, id, title, questions, names, onDone, finishSteps }: Props) {
  const conversation = useConversation();
  const [phase, setPhase] = useState<"idle" | "connecting" | "live" | "writing">("idle");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [covered, setCovered] = useState<string[]>([]);
  const [paused, setPaused] = useState(false);
  const [level, setLevel] = useState(0);
  const [writing, setWriting] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const facts = useRef<Fact[]>([]);
  const turnsRef = useRef<Turn[]>([]);
  const coveredRef = useRef<string[]>([]);
  const ended = useRef(false);
  const warned = useRef(false);
  const chat = useRef<HTMLDivElement>(null);
  const c = side === "cand"
    ? { solid: "bg-cand hover:bg-cand-dark", soft: "bg-cand-soft text-cand-dark", bubble: "bg-cand" }
    : { solid: "bg-emp hover:bg-emp-dark", soft: "bg-emp-soft text-emp-dark", bubble: "bg-emp" };

  useEffect(() => {
    chat.current?.scrollTo({ top: chat.current.scrollHeight, behavior: "smooth" });
  }, [turns.length]);

  useEffect(() => {
    if (phase !== "live") return;
    const t = setInterval(() => setLevel(conversation.isSpeaking ? 0 : conversation.getInputVolume()), 120);
    return () => clearInterval(t);
  }, [phase, conversation]);

  const finish = useCallback(async () => {
    if (ended.current) return;
    ended.current = true;
    setPhase("writing");
    setWriting(0);
    try {
      await onDone({ turns: turnsRef.current, facts: facts.current, covered: coveredRef.current });
      setWriting(2);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [onDone]);

  const start = async () => {
    setError(null);
    setPhase("connecting");
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true }).then((s) => s.getTracks().forEach((t) => t.stop()));
      const session = await api<{ signedUrl: string; dynamicVariables: Record<string, string> }>("/api/voice/session", { kind, id, snapshot: snapshot(kind, id) });
      conversation.startSession({
        signedUrl: session.signedUrl,
        dynamicVariables: session.dynamicVariables,
        clientTools: {
          note_fact: (p: { fact?: unknown; point?: unknown }) => {
            const point = (["number", "team", "contribution"].includes(text(p?.point)) ? text(p?.point) : "other") as Fact["point"];
            if (text(p?.fact)) facts.current.push({ text: text(p.fact), point, expRef: null });
          },
          mark_covered: (p: { question_id?: unknown }) => {
            const q = text(p?.question_id);
            if (q && !coveredRef.current.includes(q)) {
              coveredRef.current = [...coveredRef.current, q];
              setCovered(coveredRef.current);
            }
          },
          end_interview: () => {
            // Guard: the agent may want to stop while priority questions are still open. Tell it once what is left.
            const left = questions.filter((q) => q.priority !== "medium" && !coveredRef.current.includes(q.id));
            if (left.length && !warned.current) {
              warned.current = true;
              conversation.sendContextualUpdate(
                `Do not end the interview yet. These prepared questions are still open, ask them one at a time unless already answered: ${left.map((q) => `${q.id}: ${q.question}`).join(" | ")}`,
              );
              return;
            }
            setTimeout(() => conversation.endSession(), 2500); // let the closing sentence play
          },
        },
        onMessage: (m: { message: string; role?: "agent" | "user"; source?: "ai" | "user" }) => {
          const role = (m.role ?? (m.source === "ai" ? "agent" : "user")) === "agent" ? "agent" : "candidate";
          if (!m.message?.trim()) return;
          turnsRef.current = [...turnsRef.current, { role, text: m.message, at: new Date().toISOString() }];
          setTurns(turnsRef.current);
        },
        onConnect: () => setPhase("live"),
        onDisconnect: () => {
          if (turnsRef.current.some((t) => t.role === "candidate")) finish();
          else setPhase("idle");
        },
        onError: (message: unknown) => {
          setError(typeof message === "string" ? message : "Connection problem");
          setPhase("idle");
        },
      });
    } catch (e) {
      setError((e as Error).message.includes("Permission") ? "Please allow the microphone." : (e as Error).message);
      setPhase("idle");
    }
  };

  const togglePause = () => {
    const next = !paused;
    setPaused(next);
    conversation.setMuted(next);
    conversation.setVolume({ volume: next ? 0 : 1 });
  };

  const live = phase === "live";
  const orb = !live || paused ? "idle" : conversation.isSpeaking ? "speaking" : "listening";
  const label = phase === "idle" ? "Ready when you are" : phase === "connecting" ? "Connecting…" : phase === "writing" ? "Writing…" : paused ? "Paused" : conversation.isMuted ? "Muted" : conversation.isSpeaking ? "Speaking…" : "Listening… just talk";

  return (
    <Card className="flex h-[calc(100vh-11rem)] min-h-[480px] flex-col p-0">
      <div className="border-b border-line px-6 py-4">
        <p className="mb-3 font-semibold text-ink">{title}</p>
        <Ladder questions={questions} covered={covered} names={names} />
      </div>
      <div className="grid min-h-0 flex-1 md:grid-cols-[240px_1fr]">
        <div className="flex flex-col items-center justify-center gap-4 border-b border-line p-6 md:border-b-0 md:border-r">
          <Orb state={orb} size={96} />
          <p className={cx("rounded-full px-3 py-1 text-xs font-semibold", c.soft)}>{label}</p>
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-line">
            <div className={cx("h-full rounded-full transition-[width] duration-100", c.bubble)} style={{ width: `${live && !conversation.isMuted ? Math.min(100, Math.round(level * 250)) : 0}%` }} />
          </div>
          {phase === "writing" ? (
            <div className="w-full rounded-xl bg-soft p-3"><AiSteps steps={finishSteps} current={writing + 1} error={error} /></div>
          ) : phase === "idle" || phase === "connecting" ? (
            <button onClick={start} disabled={phase === "connecting"} className={cx("flex items-center gap-2 rounded-full px-7 py-3 font-semibold text-white disabled:opacity-60", c.solid)}>
              <Play className="size-4" /> Start
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => conversation.setMuted(!conversation.isMuted)} disabled={paused} title={conversation.isMuted ? "Unmute" : "Mute"}
                className={cx("flex size-12 items-center justify-center rounded-full border transition", conversation.isMuted && !paused ? "border-rose bg-rose text-white" : "border-line bg-white text-ink hover:bg-soft")}>
                {conversation.isMuted && !paused ? <MicOff className="size-5" /> : <Mic className="size-5" />}
              </button>
              <button onClick={togglePause} title={paused ? "Resume" : "Pause"}
                className={cx("flex size-12 items-center justify-center rounded-full border transition", paused ? cx("border-transparent text-white", c.bubble) : "border-line bg-white text-ink hover:bg-soft")}>
                {paused ? <Play className="size-5" /> : <Pause className="size-5" />}
              </button>
              <button onClick={() => conversation.endSession()} title="Finish" className="flex size-12 items-center justify-center rounded-full border border-line bg-white text-ink hover:bg-soft">
                <PhoneOff className="size-5" />
              </button>
            </div>
          )}
          {error && phase !== "writing" && <p className="text-center text-xs text-rose-600">{error}</p>}
        </div>
        <div ref={chat} className="min-h-0 space-y-3 overflow-y-auto p-6">
          {turns.length === 0 && <p className="text-center text-sm text-muted">{phase === "idle" ? "Press Start and just talk." : "…"}</p>}
          {turns.map((t, i) => (
            <div key={i} className={cx("flex fade-up", t.role === "candidate" && "justify-end")}>
              <p className={cx("max-w-[80%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed",
                t.role === "agent" ? "rounded-bl-sm bg-soft text-ink" : cx("rounded-br-sm text-white", c.bubble))}>{t.text}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function RealtimeInterview(props: Props) {
  return (
    <ConversationProvider>
      <Session {...props} />
    </ConversationProvider>
  );
}
