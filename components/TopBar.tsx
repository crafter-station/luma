"use client";

import { Menu, Search } from "lucide-react";
import { useState, useEffect } from "react";

interface Props {
  fovDegrees: number;
  onSearch: (query: string) => void;
}

export function TopBar({ fovDegrees, onSearch }: Props) {
  const [query, setQuery] = useState("");
  const [fovLabel, setFovLabel] = useState("");

  useEffect(() => {
    if (fovDegrees >= 1) setFovLabel(`FOV ${fovDegrees.toFixed(0)}°`);
    else setFovLabel(`FOV ${(fovDegrees * 60).toFixed(1)}′`);
  }, [fovDegrees]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length > 0) onSearch(query.trim());
  }

  return (
    <header className="pointer-events-auto absolute inset-x-0 top-0 z-10 flex h-12 items-center gap-3 bg-black/30 px-3 text-white backdrop-blur-sm">
      <button
        type="button"
        className="grid h-9 w-9 place-items-center rounded hover:bg-white/10"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>
      <div className="flex items-baseline gap-1 font-light tracking-wide">
        <span className="text-base">Luma</span>
        <span className="text-[10px] text-white/60">Web</span>
      </div>
      <form onSubmit={submit} className="ml-6 flex max-w-md flex-1 items-center">
        <div className="flex w-full items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-white/10 focus-within:ring-white/30">
          <Search size={16} className="text-white/60" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-white/40"
          />
        </div>
      </form>
      <div className="ml-auto flex items-center gap-3 text-xs">
        <span className="hidden font-mono text-white/70 sm:inline">{fovLabel}</span>
        <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] tracking-wide">OBSERVE</span>
      </div>
    </header>
  );
}
