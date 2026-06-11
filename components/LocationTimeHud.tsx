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
        className="pointer-events-auto absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs text-white/90 ring-1 ring-white/10 backdrop-blur-sm hover:bg-black/55"
      >
        <MapPin size={14} className="text-white/60" />
        <span className="font-light uppercase tracking-wide">{location.name}</span>
      </button>
      <div className="pointer-events-none absolute bottom-3 right-3 z-10 flex flex-col items-end rounded-md bg-black/40 px-3 py-1.5 font-mono text-xs text-white/90 ring-1 ring-white/10 backdrop-blur-sm">
        <span className="text-base leading-none">{time}</span>
        <span className="text-[10px] text-white/55">{day}</span>
      </div>
    </>
  );
}
