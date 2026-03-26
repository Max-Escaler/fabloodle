import type { ReactNode } from "react";
import { dismissHowToPlay } from "../utils/howToPlayStorage";

const PITCH = { 1: "#e74c3c", 2: "#f1c40f", 3: "#3498db" } as const;

interface HowToPlayModalProps {
  onClose: () => void;
}

function DemoCell({
  tone,
  label,
  children,
}: {
  tone: "correct" | "close" | "wrong" | "neutral";
  label: string;
  children: ReactNode;
}) {
  const bg =
    tone === "correct"
      ? "bg-[#538d4e]"
      : tone === "close"
        ? "bg-[#b59f3b]"
        : tone === "wrong"
          ? "bg-[#3a3a3c]"
          : "bg-[#1a1a1b] border border-[#3a3a3c]";
  return (
    <div
      className={`flex flex-col items-center justify-center gap-0.5 rounded-lg px-1.5 py-2 min-h-[52px] flex-1 min-w-0 max-w-[92px] ${bg}`}
    >
      <span className="text-white/55 text-[8px] font-semibold uppercase tracking-wide leading-none">
        {label}
      </span>
      <div className="text-white text-[11px] font-bold text-center leading-tight">{children}</div>
    </div>
  );
}

function PitchDots() {
  return (
    <div className="flex gap-0.5 justify-center">
      {([1, 2] as const).map((v) => (
        <span
          key={v}
          className="w-3 h-3 rounded-full inline-block shrink-0"
          style={{ backgroundColor: PITCH[v] }}
        />
      ))}
    </div>
  );
}

export function HowToPlayModal({ onClose }: HowToPlayModalProps) {
  function handleClose() {
    dismissHowToPlay();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
      onClick={handleClose}
    >
      <div
        className="relative bg-[#1a1a1b] border border-[#3a3a3c] rounded-2xl p-6 pt-12 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 text-[#818384] hover:text-white text-2xl leading-none w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#3a3a3c]/50 transition-colors"
          aria-label="Close"
        >
          ×
        </button>

        <h2 className="text-white text-2xl font-bold text-center mb-1">How To Play</h2>
        <p className="text-[#b8b8b8] text-sm text-center mb-5">
          Guess a random Flesh and Blood card!
        </p>

        <ul className="text-[#d0d0d0] text-sm space-y-2 mb-6 list-disc pl-5">
          <li>
            Green is correct, Yellow means close or partial, Grey is incorrect
          </li>
          <li>
            Arrows show whether the answer is higher or lower than your guess
          </li>
        </ul>

        <p className="text-white text-sm font-bold mb-3">Examples</p>

        <div className="space-y-4 mb-5">
          <div>
            <div className="flex gap-1 mb-2">
              <DemoCell tone="correct" label="Type">
                Action
              </DemoCell>
              <DemoCell tone="neutral" label="Cost">
                2
              </DemoCell>
              <DemoCell tone="neutral" label="Colors">
                <PitchDots />
              </DemoCell>
              <DemoCell tone="neutral" label="Class">
                Ninja
              </DemoCell>
            </div>
            <p className="text-[#b8b8b8] text-sm">
              <span className="text-white font-bold">Type</span> matches the answer exactly.
            </p>
          </div>

          <div>
            <div className="flex gap-1 mb-2">
              <DemoCell tone="neutral" label="Type">
                Action
              </DemoCell>
              <DemoCell tone="close" label="Attack">
                <span className="flex flex-col items-center gap-0.5">
                  <span>6</span>
                  <span className="text-white font-bold text-sm leading-none">▼</span>
                </span>
              </DemoCell>
              <DemoCell tone="neutral" label="Defense">
                3
              </DemoCell>
              <DemoCell tone="neutral" label="Cost">
                1
              </DemoCell>
            </div>
            <p className="text-[#b8b8b8] text-sm">
              <span className="text-white font-bold">Attack</span> is close—the answer is lower (follow
              the arrow).
            </p>
          </div>

          <div>
            <div className="flex gap-1 mb-2">
              <DemoCell tone="neutral" label="Type">
                Action
              </DemoCell>
              <DemoCell tone="neutral" label="Talent">
                None
              </DemoCell>
              <DemoCell tone="wrong" label="Keywords">
                Go again
              </DemoCell>
              <DemoCell tone="neutral" label="Class">
                Ninja
              </DemoCell>
            </div>
            <p className="text-[#b8b8b8] text-sm">
              <span className="text-white font-bold">Keywords</span> does not match the answer.
            </p>
          </div>
        </div>

        <p className="text-[#818384] text-xs mb-3">
          You can use <span className="text-[#d0d0d0] font-semibold">Get a hint</span> after a guess when
          it&apos;s available.
        </p>
        <p className="text-[#818384] text-xs mb-6">
          Rarely, two different cards share the same stats—you&apos;ll need another guess to find the
          right card.
        </p>

        <button
          type="button"
          onClick={handleClose}
          className="w-full py-3 rounded-xl bg-[#538d4e] hover:bg-[#6aad65] text-white font-bold text-base transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
