"use client";

import { Loader2, Menu, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { searchSkySources } from "@/lib/stelEngine";
import type { SkySourceSearchResult } from "@/lib/stelEngine";

interface Props {
  fovDegrees: number;
  onSelectResult: (result: SkySourceSearchResult) => void;
}

export function TopBar({ fovDegrees, onSelectResult }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SkySourceSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [fovLabel, setFovLabel] = useState("");

  const inputRef = useRef<HTMLInputElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    if (fovDegrees >= 1) setFovLabel(`FOV ${fovDegrees.toFixed(0)}°`);
    else setFovLabel(`FOV ${(fovDegrees * 60).toFixed(1)}′`);
  }, [fovDegrees]);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  // Debounced fetch
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    const id = ++requestId.current;
    setLoading(true);
    const handle = setTimeout(async () => {
      const data = await searchSkySources(trimmed, 10);
      if (id !== requestId.current) return;
      setResults(data);
      setActiveIndex(data.length > 0 ? 0 : -1);
      setLoading(false);
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  // Click outside → close dropdown
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const showDropdown = useMemo(
    () => open && query.trim().length >= 2,
    [open, query],
  );

  function commit(result: SkySourceSearchResult) {
    onSelectResult(result);
    setOpen(false);
    setSearchOpen(false);
    setQuery("");
    setResults([]);
    setActiveIndex(-1);
    inputRef.current?.blur();
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = results[activeIndex] ?? results[0];
      if (pick) commit(pick);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  function renderSearchField(extraInputClass = "") {
    return (
      <div
        ref={wrapperRef}
        className="relative flex w-full items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-white/10 focus-within:ring-white/30"
      >
        <Search size={16} className="text-white/60" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKey}
          placeholder="Search a planet, star, or DSO…"
          className={"w-full bg-transparent text-sm outline-none placeholder:text-white/40 " + extraInputClass}
          autoComplete="off"
          spellCheck={false}
        />
        {loading ? <Loader2 size={14} className="animate-spin text-white/60" /> : null}
        {query.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
              setOpen(false);
              setSearchOpen(false);
            }}
            aria-label="Clear search"
            className="grid h-6 w-6 place-items-center rounded-full text-white/60 hover:text-white"
          >
            <X size={14} />
          </button>
        ) : null}

        {showDropdown ? (
          <div
            role="listbox"
            className="absolute left-0 right-0 top-full z-20 mt-2 max-h-[min(60vh,420px)] overflow-y-auto rounded-lg bg-black/85 p-1 text-sm shadow-xl ring-1 ring-white/10 backdrop-blur-md"
          >
            {results.length === 0 && !loading ? (
              <div className="px-3 py-3 text-xs text-white/55">No matches found.</div>
            ) : (
              results.map((r, i) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={i === activeIndex}
                  key={(r.match ?? r.shortLabel) + i}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseDown={(e) => e.preventDefault() /* don't blur the input */}
                  onClick={() => commit(r)}
                  className={
                    "flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left transition " +
                    (i === activeIndex ? "bg-white/10" : "hover:bg-white/5")
                  }
                >
                  <span className="truncate">
                    <span className="text-white/95">{r.shortLabel}</span>
                    {r.match && r.match !== r.shortLabel ? (
                      <span className="ml-2 text-[11px] text-white/40">{r.match}</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-[10px] uppercase tracking-wide text-white/45">
                    {r.typeLabel}
                  </span>
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <header
      className="pointer-events-auto absolute inset-x-0 top-0 z-20 flex h-12 items-center gap-2 bg-black/30 px-2 text-white backdrop-blur-sm sm:gap-3 sm:px-3"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <button
        type="button"
        className="grid h-9 w-9 shrink-0 place-items-center rounded hover:bg-white/10"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <div
        className={
          "flex shrink-0 items-baseline gap-1 font-light tracking-wide " +
          (searchOpen ? "hidden sm:flex" : "flex")
        }
      >
        <span className="text-base">Luma</span>
        <span className="text-[10px] text-white/60">Web</span>
      </div>

      {/* Desktop search */}
      <div className="ml-4 hidden max-w-md flex-1 items-center sm:flex">{renderSearchField()}</div>

      {/* Mobile search */}
      <div
        className={
          "ml-1 flex flex-1 items-center sm:hidden " + (searchOpen ? "" : "justify-end")
        }
      >
        {searchOpen ? (
          renderSearchField()
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
      </div>

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
