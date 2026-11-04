import type { ReactNode } from "react";
import { dismissHowToPlay } from "../utils/howToPlayStorage";
import { trackHowToPlayDismissed } from "../utils/analytics";
import { Modal, ModalClose } from "./ui/Modal";
import { PitchDots } from "./ui/Pitch";

interface HowToPlayModalProps {
  onClose: () => void;
}

type Tone = "correct" | "close" | "wrong" | "neutral";

const TONE: Record<Tone, string> = {
  correct: "bg-hit text-on-hit",
  close: "bg-near text-on-near",
  wrong: "bg-miss text-on-miss",
  neutral: "bg-sunken text-muted ring-1 ring-inset ring-line",
};

function DemoCell({ tone, label, children }: { tone: Tone; label: string; children: ReactNode }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-1 rounded-md px-1.5 py-2 min-h-[56px] flex-1 min-w-0 ${TONE[tone]}`}
    >
      <span className="text-[9px] font-semibold uppercase tracking-[0.08em] leading-none opacity-70">
        {label}
      </span>
      <div className="text-xs font-bold text-center leading-tight">{children}</div>
    </div>
  );
}

function Example({ cells, children }: { cells: ReactNode; children: ReactNode }) {
  return (
    <div>
      <div className="flex gap-1.5 mb-2">{cells}</div>
      <p className="text-sm text-muted">{children}</p>
    </div>
  );
}

function Legend({ tone, label }: { tone: Tone; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className={`w-3.5 h-3.5 rounded-[4px] ${TONE[tone]}`} />
      {label}
    </span>
  );
}

export function HowToPlayModal({ onClose }: HowToPlayModalProps) {
  function handleClose() {
    trackHowToPlayDismissed();
    dismissHowToPlay();
    onClose();
  }

  return (
    <Modal onClose={handleClose} z="z-[60]" label="How to play" className="max-h-[90dvh] overflow-y-auto">
      <div className="flex items-start justify-between gap-3 px-6 pt-6">
        <div>
          <p className="eyebrow !text-accent-text">How to play</p>
          <h2 className="page-title !text-2xl mt-1">Guess the daily card</h2>
        </div>
        <ModalClose onClick={handleClose} className="-mr-2 -mt-1" />
      </div>

      <div className="px-6 pt-3 pb-6">
        <p className="text-sm text-muted">
          Every day there&apos;s a new mystery Flesh and Blood card. Guess any card and each of its
          stats is compared with the answer.
        </p>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4">
          <Legend tone="correct" label="Correct" />
          <Legend tone="close" label="Close or partial" />
          <Legend tone="wrong" label="Wrong" />
        </div>
        <p className="text-sm text-muted mt-2">
          Arrows on numbers show whether the answer is higher ▲ or lower ▼.
        </p>

        <p className="section-title mt-6 mb-3">Examples</p>
        <div className="space-y-4">
          <Example
            cells={
              <>
                <DemoCell tone="correct" label="Type">Action</DemoCell>
                <DemoCell tone="neutral" label="Cost">2</DemoCell>
                <DemoCell tone="neutral" label="Colors">
                  <PitchDots values={[1, 2]} dotClass="w-3 h-3" gap="gap-0.5" />
                </DemoCell>
                <DemoCell tone="neutral" label="Class">Ninja</DemoCell>
              </>
            }
          >
            <span className="text-fg font-semibold">Type</span> matches the answer exactly.
          </Example>

          <Example
            cells={
              <>
                <DemoCell tone="neutral" label="Type">Action</DemoCell>
                <DemoCell tone="close" label="Attack">
                  <span className="flex flex-col items-center gap-0.5">
                    <span>6</span>
                    <span className="text-[11px] leading-none opacity-80">▼</span>
                  </span>
                </DemoCell>
                <DemoCell tone="neutral" label="Defense">3</DemoCell>
                <DemoCell tone="neutral" label="Cost">1</DemoCell>
              </>
            }
          >
            <span className="text-fg font-semibold">Attack</span> is close, and the answer is lower.
          </Example>

          <Example
            cells={
              <>
                <DemoCell tone="neutral" label="Type">Action</DemoCell>
                <DemoCell tone="neutral" label="Talent">None</DemoCell>
                <DemoCell tone="wrong" label="Keywords">Go again</DemoCell>
                <DemoCell tone="neutral" label="Class">Ninja</DemoCell>
              </>
            }
          >
            <span className="text-fg font-semibold">Keywords</span> don&apos;t match the answer.
          </Example>
        </div>

        <div className="rounded-md bg-sunken px-3.5 py-3 mt-6 space-y-1.5 text-xs text-muted">
          <p>
            Stuck? Use <span className="text-fg font-semibold">Get a hint</span> after a guess to
            reveal one of the answer&apos;s stats.
          </p>
          <p>
            Rarely, two cards share the same stats. You&apos;ll need one more guess to find the right
            one.
          </p>
        </div>

        <button type="button" onClick={handleClose} className="btn btn-primary w-full mt-6">
          Start guessing
        </button>
      </div>
    </Modal>
  );
}
