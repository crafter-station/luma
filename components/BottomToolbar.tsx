"use client";

import {
  Cloud,
  Compass,
  Globe2,
  Maximize2,
  Mountain,
  Pause,
  Play,
  Sparkles,
  Star,
  Telescope,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type LayerKey =
  | "constellations"
  | "atmosphere"
  | "landscape"
  | "azimuthalGrid"
  | "equatorialGrid"
  | "dsos"
  | "dss";

interface ToolbarItem {
  key: LayerKey;
  label: string;
  icon: LucideIcon;
}

const ITEMS: ToolbarItem[] = [
  { key: "constellations", label: "Constellations", icon: Sparkles },
  { key: "atmosphere", label: "Atmosphere", icon: Cloud },
  { key: "landscape", label: "Landscape", icon: Mountain },
  { key: "azimuthalGrid", label: "Azimuthal Grid", icon: Compass },
  { key: "equatorialGrid", label: "Equatorial Grid", icon: Globe2 },
  { key: "dsos", label: "Nebulae", icon: Star },
  { key: "dss", label: "Deep Sky Survey", icon: Telescope },
];

interface Props {
  layers: Record<LayerKey, boolean>;
  paused: boolean;
  onToggle: (key: LayerKey) => void;
  onTogglePause: () => void;
  onFullscreen: () => void;
}

export function BottomToolbar({ layers, paused, onToggle, onTogglePause, onFullscreen }: Props) {
  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-3 z-10 flex justify-center">
      <div className="flex items-center gap-1 rounded-full bg-black/40 px-3 py-2 text-white backdrop-blur-sm ring-1 ring-white/10">
        {ITEMS.map(({ key, label, icon: Icon }) => {
          const active = layers[key];
          return (
            <button
              key={key}
              type="button"
              title={label}
              aria-pressed={active}
              onClick={() => onToggle(key)}
              className={
                "grid h-10 w-10 place-items-center rounded-full transition " +
                (active ? "text-white" : "text-white/40 hover:text-white/70")
              }
            >
              <Icon size={18} />
            </button>
          );
        })}
        <span className="mx-1 h-6 w-px bg-white/15" />
        <button
          type="button"
          title={paused ? "Resume real-time motion" : "Pause time"}
          aria-pressed={paused}
          onClick={onTogglePause}
          className={
            "grid h-10 w-10 place-items-center rounded-full transition " +
            (paused ? "text-amber-300" : "text-white/60 hover:text-white")
          }
        >
          {paused ? <Play size={18} /> : <Pause size={18} />}
        </button>
        <button
          type="button"
          title="Fullscreen"
          onClick={onFullscreen}
          className="grid h-10 w-10 place-items-center rounded-full text-white/60 hover:text-white"
        >
          <Maximize2 size={18} />
        </button>
      </div>
    </div>
  );
}
