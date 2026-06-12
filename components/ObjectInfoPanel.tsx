"use client";

import { X } from "lucide-react";
import type { ObjectSummary } from "@/lib/formatCoords";

interface Props {
  summary: ObjectSummary | null;
  onClose: () => void;
}

export function ObjectInfoPanel({ summary, onClose }: Props) {
  if (!summary) return null;

  const otherNames = summary.designations.slice(1, 8);

  return (
    <aside
      className={
        // Mobile: bottom-sheet above the toolbar+HUD strip. Desktop: floating top-left card.
        "pointer-events-auto absolute z-10 bg-black/65 text-white shadow-xl ring-1 ring-white/10 backdrop-blur-md " +
        "inset-x-2 bottom-[calc(env(safe-area-inset-bottom)+7rem)] max-h-[40vh] overflow-y-auto rounded-lg p-3 " +
        "sm:inset-auto sm:left-3 sm:top-16 sm:bottom-auto sm:w-[420px] sm:max-w-[calc(100vw-1.5rem)] sm:max-h-[calc(100vh-6rem)] sm:p-4"
      }
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close info panel"
        className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
      >
        <X size={16} />
      </button>
      <div className="pr-7">
        <h2 className="text-lg font-light leading-tight sm:text-xl">{summary.title}</h2>
        {otherNames.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1 text-[11px] text-white/60">
            <span className="text-white/40">Also known as</span>
            {otherNames.map((n) => (
              <span key={n} className="rounded bg-white/5 px-1.5 py-0.5 text-white/80">
                {n}
              </span>
            ))}
          </div>
        )}
      </div>

      <dl className="mt-3 grid grid-cols-[max-content,1fr] gap-x-3 gap-y-1.5 text-[13px] sm:mt-4 sm:gap-x-4 sm:gap-y-2 sm:text-sm">
        <Row label="Magnitude" value={summary.magnitude === null ? "Unknown" : summary.magnitude.toFixed(2)} />
        <Row label="Ra/Dec" value={`${summary.ra}    ${summary.dec}`} mono />
        <Row label="Az/Alt" value={`${summary.az}    ${summary.alt}`} mono />
        <Row label="Visibility" value={summary.visibilityNote} />
      </dl>
    </aside>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <>
      <dt className="text-white/55">{label}</dt>
      <dd
        className={
          (mono ? "font-mono text-[11px] sm:text-[12px] " : "") +
          "break-words text-white/95"
        }
      >
        {value}
      </dd>
    </>
  );
}
