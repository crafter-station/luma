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
    <aside className="pointer-events-auto absolute left-3 top-16 z-10 w-[min(420px,calc(100vw-1.5rem))] rounded-lg bg-black/55 p-4 text-white shadow-xl ring-1 ring-white/10 backdrop-blur-md">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close info panel"
        className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
      >
        <X size={16} />
      </button>
      <div className="pr-7">
        <h2 className="text-xl font-light leading-tight">{summary.title}</h2>
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

      <dl className="mt-4 grid grid-cols-[max-content,1fr] gap-x-4 gap-y-2 text-sm">
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
      <dd className={mono ? "font-mono text-[12px] text-white/95" : "text-white/95"}>{value}</dd>
    </>
  );
}
