"use client";
import { cx } from "./ui";

/** The Smart Portfolio voice orb: spins faster when the assistant speaks, pings while listening. */
export function Orb({ state, size = 120 }: { state: "idle" | "speaking" | "listening" | "thinking" | "transcribing"; size?: number }) {
  return (
    <div className={cx("orb", state === "transcribing" ? "thinking" : state)} style={{ "--size": `${size}px` } as React.CSSProperties} aria-hidden>
      <div className="orb-halo" />
      <div className="orb-body">
        <div className="orb-swirl" />
        <div className="orb-swirl reverse" />
        <div className="orb-shine" />
      </div>
    </div>
  );
}
