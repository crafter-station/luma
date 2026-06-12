"use client";

import { MapPin } from "lucide-react";
import type { UserLocation } from "@/lib/geolocation";

interface Props {
  location: UserLocation;
  date: Date;
  onEditLocation: () => void;
}

function pad(n: number, w: number) {
  const s = `${n}`;
  return s.length >= w ? s : "0".repeat(w - s.length) + s;
}

export function LocationTimeHud({ location, date, onEditLocation }: Props) {
  const time = `${pad(date.getHours(), 2)}:${pad(date.getMinutes(), 2)}:${pad(date.getSeconds(), 2)}`;
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1, 2)}-${pad(date.getDate(), 2)}`;

  return (
    <>
      <button
        type="button"
        onClick={onEditLocation}
        className="pointer-events-auto absolute bottom-[calc(env(safe-area-inset-bottom)+4rem)] left-2 z-10 flex max-w-[55vw] items-center gap-1.5 truncate rounded-full bg-black/40 px-2.5 py-1 text-[11px] text-white/90 ring-1 ring-white/10 backdrop-blur-sm hover:bg-black/55 sm:bottom-3 sm:left-3 sm:max-w-none sm:px-3 sm:py-1.5 sm:text-xs"
      >
        <MapPin size={12} className="shrink-0 text-white/60 sm:[&]:!size-[14px]" />
        <span className="truncate font-light uppercase tracking-wide">{location.name}</span>
      </button>
      <div className="pointer-events-none absolute bottom-[calc(env(safe-area-inset-bottom)+4rem)] right-2 z-10 flex flex-col items-end rounded-md bg-black/40 px-2.5 py-1 font-mono text-[11px] text-white/90 ring-1 ring-white/10 backdrop-blur-sm sm:bottom-3 sm:right-3 sm:px-3 sm:py-1.5 sm:text-xs">
        <span className="text-sm leading-none sm:text-base">{time}</span>
        <span className="text-[9px] text-white/55 sm:text-[10px]">{day}</span>
      </div>
    </>
  );
}
