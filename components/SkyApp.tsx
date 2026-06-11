"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadStelEngine, dateToMJD } from "@/lib/stelEngine";
import type { StelEngine, StelObject } from "@/lib/stelEngine";
import { summarizeObject } from "@/lib/formatCoords";
import type { ObjectSummary } from "@/lib/formatCoords";
import {
  DEFAULT_LOCATION,
  loadStoredLocation,
  requestBrowserGeolocation,
  resolveInitialLocation,
  saveLocation,
} from "@/lib/geolocation";
import type { UserLocation } from "@/lib/geolocation";
import { TopBar } from "./TopBar";
import { BottomToolbar } from "./BottomToolbar";
import type { LayerKey } from "./BottomToolbar";
import { ObjectInfoPanel } from "./ObjectInfoPanel";
import { LocationTimeHud } from "./LocationTimeHud";

const DEG = Math.PI / 180;

const DEFAULT_LAYERS: Record<LayerKey, boolean> = {
  constellations: true,
  atmosphere: true,
  landscape: true,
  azimuthalGrid: false,
  equatorialGrid: false,
  dsos: true,
  dss: false,
};

export default function SkyApp() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<StelEngine | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selection, setSelection] = useState<ObjectSummary | null>(null);
  const [fovDegrees, setFovDegrees] = useState(120);
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>(DEFAULT_LAYERS);
  const [location, setLocation] = useState<UserLocation>(() => loadStoredLocation() ?? DEFAULT_LOCATION);
  const [now, setNow] = useState(() => new Date());
  const [paused, setPaused] = useState(false);

  // 1-second tick for the on-screen clock.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Bootstrap engine once the canvas is mounted.
  useEffect(() => {
    if (!canvasRef.current) return;
    let cancelled = false;
    loadStelEngine(canvasRef.current)
      .then((stel) => {
        if (cancelled) return;
        engineRef.current = stel;

        const obs = stel.core.observer;
        obs.latitude = location.latitude * DEG;
        obs.longitude = location.longitude * DEG;
        obs.elevation = location.elevation;
        obs.utc = dateToMJD(new Date());
        obs.yaw = 0;
        obs.pitch = 30 * DEG;
        stel.core.fov = 120 * DEG;
        stel.core.time_speed = 1;

        applyLayers(stel, DEFAULT_LAYERS);

        const refresh = () => {
          const sel = stel.core.selection as StelObject | 0 | null;
          if (sel && typeof sel === "object") {
            setSelection(summarizeObject(stel, sel));
          } else {
            setSelection(null);
          }
          setFovDegrees(stel.core.fov / DEG);
        };

        if (typeof stel.onValueChanged === "function") {
          stel.onValueChanged((path) => {
            if (path === "core.selection" || path === "core.fov" || path.startsWith("core.observer")) {
              refresh();
            }
          });
        } else if (typeof stel.change === "function") {
          stel.change((_obj, attr) => {
            if (attr !== "hovered") refresh();
          });
        }

        refresh();
        setReady(true);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      });

    return () => {
      cancelled = true;
    };
    // We intentionally exclude `location` so the engine isn't re-initialised; location updates flow through the next effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push location updates into the engine and persist them.
  useEffect(() => {
    const stel = engineRef.current;
    if (!stel) return;
    stel.core.observer.latitude = location.latitude * DEG;
    stel.core.observer.longitude = location.longitude * DEG;
    stel.core.observer.elevation = location.elevation;
    saveLocation(location);
  }, [location]);

  // Try browser geolocation on first mount (only if we don't have a stored value).
  useEffect(() => {
    if (loadStoredLocation()) return;
    let cancelled = false;
    resolveInitialLocation().then((loc) => {
      if (!cancelled) setLocation(loc);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Resize canvas to match viewport (account for devicePixelRatio).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const handleToggle = useCallback((key: LayerKey) => {
    setLayers((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      const stel = engineRef.current;
      if (stel) applyLayer(stel, key, next[key]);
      return next;
    });
  }, []);

  const handleTogglePause = useCallback(() => {
    setPaused((prev) => {
      const next = !prev;
      const stel = engineRef.current;
      if (stel) stel.core.time_speed = next ? 0 : 1;
      return next;
    });
  }, []);

  const handleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  }, []);

  const handleSearch = useCallback((query: string) => {
    // Real catalog lookup is out of scope for the MVP; we forward to the noctuasky API
    // as a side-channel so search at least surfaces something useful.
    window.open(
      `https://api.noctuasky.com/api/v1/skysources/?q=${encodeURIComponent(query)}`,
      "_blank",
      "noopener",
    );
  }, []);

  const handleCloseSelection = useCallback(() => {
    const stel = engineRef.current;
    if (stel) (stel.core as { selection: number }).selection = 0;
    setSelection(null);
  }, []);

  const handleEditLocation = useCallback(() => {
    requestBrowserGeolocation()
      .then((live) => setLocation(live))
      .catch(() => {
        // Browser denied or unavailable — leave the user where they were.
      });
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 overflow-hidden bg-[#05070d] text-white">
      <canvas
        ref={canvasRef}
        id="stel-canvas"
        className="absolute inset-0 block h-full w-full touch-none"
      />
      {!ready && !error && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-sm tracking-wide text-white/60">Loading sky engine…</div>
        </div>
      )}
      {error && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="max-w-md rounded bg-black/60 p-4 text-sm text-red-200 ring-1 ring-red-400/30">
            Failed to load Stellarium engine: {error}
          </div>
        </div>
      )}
      <TopBar fovDegrees={fovDegrees} onSearch={handleSearch} />
      <ObjectInfoPanel summary={selection} onClose={handleCloseSelection} />
      <BottomToolbar
        layers={layers}
        paused={paused}
        onToggle={handleToggle}
        onTogglePause={handleTogglePause}
        onFullscreen={handleFullscreen}
      />
      <LocationTimeHud location={location} date={now} onEditLocation={handleEditLocation} />
    </div>
  );
}

function applyLayer(stel: StelEngine, key: LayerKey, value: boolean) {
  switch (key) {
    case "constellations":
      stel.core.constellations.lines_visible = value;
      break;
    case "atmosphere":
      stel.core.atmosphere.visible = value;
      break;
    case "landscape":
      stel.core.landscapes.visible = value;
      break;
    case "azimuthalGrid":
      stel.core.lines.azimuthal.visible = value;
      break;
    case "equatorialGrid":
      stel.core.lines.equatorial.visible = value;
      break;
    case "dsos":
      stel.core.dsos.visible = value;
      break;
    case "dss":
      stel.core.dss.visible = value;
      break;
  }
}

function applyLayers(stel: StelEngine, layers: Record<LayerKey, boolean>) {
  (Object.keys(layers) as LayerKey[]).forEach((k) => applyLayer(stel, k, layers[k]));
}
