"use client";

import { Menu, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Props {
  fovDegrees: number;
  onSearch: (query: string) => void;
}

export function TopBar({ fovDegrees, onSearch }: Props) {
  const [query, setQuery] = useState("");
  const [fovLabel, setFovLabel] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (fovDegrees >= 1) setFovLabel(`FOV ${fovDegrees.toFixed(0)}°`);
    else setFovLabel(`FOV ${(fovDegrees * 60).toFixed(1)}′`);
  }, [fovDegrees]);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q.length > 0) onSearch(q);
  }

  return (
    <header
      className="pointer-events-auto absolute inset-x-0 top-0 z-10 flex h-12 items-center gap-2 bg-black/30 px-2 text-white backdrop-blur-sm sm:gap-3 sm:px-3"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <button
        type="button"
        className="grid h-9 w-9 shrink-0 place-items-center rounded hover:bg-white/10"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Brand: hidden when the mobile search drawer is open to free up space */}
      <div
        className={
          "flex shrink-0 items-baseline gap-1 font-light tracking-wide " +
          (searchOpen ? "hidden sm:flex" : "flex")
        }
      >
        <span className="text-base">Luma</span>
        <span className="text-[10px] text-white/60">Web</span>
      </div>

      {/* Desktop / sm+: inline search bar */}
      <form onSubmit={submit} className="ml-4 hidden max-w-md flex-1 items-center sm:flex">
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

      {/* Mobile: search appears inline when opened, otherwise a single icon */}
      <form
        onSubmit={submit}
        className={
          "ml-1 flex flex-1 items-center sm:hidden " + (searchOpen ? "" : "justify-end")
        }
      >
        {searchOpen ? (
          <div className="flex w-full items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-white/10 focus-within:ring-white/30">
            <Search size={16} className="text-white/60" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-white/40"
            />
            <button
              type="button"
              onClick={() => {
                setSearchOpen(false);
                setQuery("");
              }}
              aria-label="Close search"
              className="grid h-6 w-6 place-items-center rounded-full text-white/60 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Open search"
            className="grid h-9 w-9 place-items-center rounded hover:bg-white/10"
          >
            <Search size={18} />
          </button>
        )}
      </form>

      {/* Right metadata: hidden on mobile when search is open */}
      <div
        className={
          "ml-auto flex shrink-0 items-center gap-2 text-xs sm:gap-3 " +
          (searchOpen ? "hidden sm:flex" : "flex")
        }
      >
        <span className="hidden font-mono text-white/70 md:inline">{fovLabel}</span>
        <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] tracking-wide sm:px-3 sm:text-[11px]">
          OBSERVE
        </span>
      </div>
    </header>
  );
}
