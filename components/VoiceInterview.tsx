"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard, Mic, MicOff, Pause, Play, Send } from "lucide-react";
import { useVoice } from "./voice";
import { AiSteps, Button, Card, cx, type Side } from "./ui";
import { Orb } from "./Orb";
import { Ladder } from "./Ladder";
import type { BriefQuestion, InterviewState } from "@/lib/types";

export type InterviewData = { interview: InterviewState; questions: BriefQuestion[] };

/**
 * The HumanTouch voice screen, shared by job seekers and hiring managers. Hands-free: the AI speaks,
 * the mic opens by itself and the answer is sent after a short pause. Only Mute and Pause remain.
 */
export function VoiceInterview({
  side, title, initial, names, keyterms, onAnswer, onFinish, finishSteps,
}: {
  side: Side;
  title: string;
  initial: InterviewData;
  names: Record<string, string>;
  keyterms: string[];
  onAnswer: (answer: string) => Promise<InterviewData>;
  onFinish: () => Promise<void>;
  finishSteps: string[];
}) {
  const voice = useVoice();
  const [data, setData] = useState(initial);
  const [live, setLive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [typing, setTyping] = useState(false);
  const [text, setText] = useState("");
  const [writing, setWriting] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const gen = useRef(0);
  const flags = useRef({ paused: false, muted: false, typing: false });
  const chat = useRef<HTMLDivElement>(null);
  const iv = data.interview;
  const lastTurn = iv.turns[iv.turns.length - 1];
  const c = side === "cand"
    ? { solid: "bg-cand hover:bg-cand-dark", soft: "bg-cand-soft text-cand-dark", bubble: "bg-cand", ring: "focus:border-cand focus:ring-cand/20" }
    : { solid: "bg-emp hover:bg-emp-dark", soft: "bg-emp-soft text-emp-dark", bubble: "bg-emp", ring: "focus:border-emp focus:ring-emp/20" };

  useEffect(() => {
    chat.current?.scrollTo({ top: chat.current.scrollHeight, behavior: "smooth" });
  }, [iv.turns.length, thinking]);

  const send = useCallback(async (answer: string) => {
    if (!answer.trim()) return;
    setError(null);
    setThinking(true);
    setText("");
    setData((d) => ({ ...d, interview: { ...d.interview, turns: [...d.interview.turns, { role: "candidate", text: answer, at: new Date().toISOString() }] } }));
    try {
      setData(await onAnswer(answer));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setThinking(false);
    }
  }, [onAnswer]);

  const listenLoop = useCallback(async (g: number) => {
    while (g === gen.current && !flags.current.paused && !flags.current.muted && !flags.current.typing) {
      let heard = "";
      try {
        heard = await voice.listen(keyterms);
      } catch {
        setError("Microphone unavailable: you can type instead.");
        flags.current.typing = true;
        setTyping(true);
        return;
      }
      if (g !== gen.current) return;
      if (heard) {
        await send(heard);
        return; // the next question starts a new cycle
      }
    }
  }, [voice, keyterms, send]);

  /** One cycle: speak the latest question, then listen hands-free. */
  const cycle = useCallback(async (question: string) => {
    const g = ++gen.current;
    voice.stopListening();
    await voice.speak(question);
    if (g === gen.current && !flags.current.paused) listenLoop(g);
  }, [voice, listenLoop]);

  useEffect(() => {
    if (live && !flags.current.paused && lastTurn?.role === "agent" && !iv.done) cycle(lastTurn.text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iv.turns.length, live]);

  const finish = useCallback(async () => {
    gen.current++;
    voice.stopListening();
    voice.stopSpeaking();
    setError(null);
    setWriting(0);
    try {
      await onFinish();
      setWriting(2);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [voice, onFinish]);

  useEffect(() => {
    if (iv.done && writing < 0) setTimeout(finish, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iv.done]);

  const togglePause = () => {
    const next = !paused;
    flags.current.paused = next;
    setPaused(next);
    if (next) {
      gen.current++;
      voice.stopListening();
      voice.stopSpeaking();
    } else if (lastTurn?.role === "agent") {
      cycle(lastTurn.text);
    }
  };

  const toggleMute = () => {
    const next = !muted;
    flags.current.muted = next;
    setMuted(next);
    if (next) voice.stopListening();
    else if (!paused && !thinking && !voice.speaking) listenLoop(gen.current);
  };

  const toggleTyping = () => {
    const next = !typing;
    flags.current.typing = next;
    setTyping(next);
    if (next) voice.stopListening();
    else if (!paused && !thinking && !voice.speaking) listenLoop(gen.current);
  };

  const answers = iv.turns.filter((t) => t.role === "candidate").length;
  const status = !live || paused ? "idle" : thinking ? "thinking" : voice.transcribing ? "transcribing" : voice.speaking ? "speaking" : voice.recording ? "listening" : "idle";
  const label = !live ? "Ready when you are" : paused ? "Paused" : thinking ? "Thinking…" : voice.transcribing ? "Writing down…" : voice.speaking ? "Speaking…" : muted ? "Muted" : typing ? "Type your answer" : voice.recording ? "Listening… just talk" : "…";

  return (
    <Card className="flex h-[calc(100vh-11rem)] min-h-[480px] flex-col p-0">
      <div className="border-b border-line px-6 py-4">
        <p className="mb-3 font-semibold text-ink">{title}</p>
        <Ladder questions={data.questions} covered={iv.covered} names={names} />
      </div>

      <div className="grid min-h-0 flex-1 md:grid-cols-[240px_1fr]">
        {/* Voice */}
        <div className="flex flex-col items-center justify-center gap-4 border-b border-line p-6 md:border-b-0 md:border-r">
          <Orb state={status} size={96} />
          <p className={cx("rounded-full px-3 py-1 text-xs font-semibold", c.soft)}>{label}</p>
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-line">
            <div className={cx("h-full rounded-full transition-[width] duration-75", c.bubble)} style={{ width: `${voice.recording && !muted ? Math.round(voice.level * 100) : 0}%` }} />
          </div>

          {writing >= 0 ? (
            <div className="w-full rounded-xl bg-soft p-3"><AiSteps steps={finishSteps} current={writing + 1} error={error} /></div>
          ) : !live ? (
            <button onClick={() => setLive(true)} className={cx("flex items-center gap-2 rounded-full px-7 py-3 font-semibold text-white", c.solid)}>
              <Play className="size-4" /> Start
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={toggleMute} title={muted ? "Unmute" : "Mute"}
                className={cx("flex size-12 items-center justify-center rounded-full border transition", muted ? "border-rose bg-rose text-white" : "border-line bg-white text-ink hover:bg-soft")}>
                {muted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
              </button>
              <button onClick={togglePause} title={paused ? "Resume" : "Pause"}
                className={cx("flex size-12 items-center justify-center rounded-full border transition", paused ? cx("border-transparent text-white", c.bubble) : "border-line bg-white text-ink hover:bg-soft")}>
                {paused ? <Play className="size-5" /> : <Pause className="size-5" />}
              </button>
            </div>
          )}

          {live && writing < 0 && (
            <div className="flex flex-col items-center gap-1.5">
              <button onClick={toggleTyping} className="flex items-center gap-1 text-xs text-muted hover:text-ink"><Keyboard className="size-3.5" /> {typing ? "Back to voice" : "Type instead"}</button>
              {answers >= 2 && <button onClick={finish} disabled={thinking} className="text-xs font-semibold text-muted hover:text-ink">Finish now</button>}
            </div>
          )}
          {error && writing < 0 && <p className="text-center text-xs text-rose-600">{error}</p>}
        </div>

        {/* Conversation */}
        <div className="flex min-h-0 flex-col">
          <div ref={chat} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-6">
            {iv.turns.map((t, i) => (
              <div key={i} className={cx("flex fade-up", t.role === "candidate" && "justify-end")}>
                <p className={cx("max-w-[80%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed",
                  t.role === "agent" ? "rounded-bl-sm bg-soft text-ink" : cx("rounded-br-sm text-white", c.bubble))}>{t.text}</p>
              </div>
            ))}
            {thinking && <div className="flex"><p className="rounded-2xl rounded-bl-sm bg-soft px-4 py-2.5 text-muted">…</p></div>}
          </div>
          {typing && writing < 0 && (
            <form className="flex gap-2 border-t border-line p-4" onSubmit={(e) => { e.preventDefault(); send(text); }}>
              <input autoFocus value={text} onChange={(e) => setText(e.target.value)} disabled={thinking} placeholder="Type your answer…"
                className={cx("flex-1 rounded-[10px] border border-slate-300 px-4 py-2.5 text-ink outline-none focus:ring-3", c.ring)} />
              <Button side={side} type="submit" disabled={!text.trim()} loading={thinking}><Send className="size-4" /></Button>
            </form>
          )}
        </div>
      </div>
    </Card>
  );
}
