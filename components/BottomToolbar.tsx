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
  const btn =
    "grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full transition shrink-0";
  const iconSize = 16;

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-10 flex justify-center px-2">
      <div className="flex max-w-full items-center gap-0.5 sm:gap-1 overflow-x-auto rounded-full bg-black/40 px-2 sm:px-3 py-1.5 sm:py-2 text-white backdrop-blur-sm ring-1 ring-white/10 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ITEMS.map(({ key, label, icon: Icon }) => {
          const active = layers[key];
          return (
            <button
              key={key}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={active}
              onClick={() => onToggle(key)}
              className={btn + " " + (active ? "text-white" : "text-white/40 hover:text-white/70")}
            >
              <Icon size={iconSize} className="sm:[&]:!size-[18px]" />
            </button>
          );
        })}
        <span className="mx-0.5 sm:mx-1 h-6 w-px shrink-0 bg-white/15" />
        <button
          type="button"
          title={paused ? "Resume real-time motion" : "Pause time"}
          aria-label={paused ? "Resume" : "Pause"}
          aria-pressed={paused}
          onClick={onTogglePause}
          className={btn + " " + (paused ? "text-amber-300" : "text-white/60 hover:text-white")}
        >
          {paused ? <Play size={iconSize} className="sm:[&]:!size-[18px]" /> : <Pause size={iconSize} className="sm:[&]:!size-[18px]" />}
        </button>
        <button
          type="button"
          title="Fullscreen"
          aria-label="Fullscreen"
          onClick={onFullscreen}
          className={btn + " text-white/60 hover:text-white hidden sm:grid"}
        >
          <Maximize2 size={iconSize} className="sm:[&]:!size-[18px]" />
        </button>
      </div>
    </div>
  );
}
