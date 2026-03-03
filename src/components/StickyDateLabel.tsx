import { useState, useEffect, useRef } from "react";
import { neutral } from "../lib/palette";

type Phase = "idle" | "exit" | "enter";

export function StickyDateLabel({ date }: { date: string }) {
  const [displayed, setDisplayed] = useState(date);
  const [phase, setPhase] = useState<Phase>("idle");
  const prevDate = useRef(date);

  useEffect(() => {
    if (date === prevDate.current) return;
    prevDate.current = date;

    // Phase 1: slide current text up + fade out
    setPhase("exit");

    const exitTimer = setTimeout(() => {
      // Swap to new text
      setDisplayed(date);
      setPhase("enter");

      // Need a rAF so the browser paints the initial "enter" position
      // before we transition to final position
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setPhase("idle");
        });
      });
    }, 250);

    return () => clearTimeout(exitTimer);
  }, [date]);

  const transform =
    phase === "exit"
      ? "translateY(-120%)"
      : phase === "enter"
        ? "translateY(20%)"
        : "translateY(0)";

  const opacity = phase === "idle" ? 1 : 0;

  return (
    <div style={containerStyle}>
      <div
        style={{
          transform,
          opacity,
          transition: phase === "enter" ? "none" : "transform 250ms ease, opacity 250ms ease",
        }}
      >
        {displayed}
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  position: "absolute",
  top: "56px",
  left: "16px",
  pointerEvents: "none",
  fontFamily: "'SF Mono', monospace",
  fontSize: "18px",
  fontWeight: 600,
  color: neutral[300],
  background: "rgba(10,10,15,0.7)",
  backdropFilter: "blur(10px)",
  border: "1px solid #2a2a3a",
  borderLeft: "2px solid #555577",
  padding: "4px 12px",
  borderRadius: "6px",
  overflow: "hidden",
};
