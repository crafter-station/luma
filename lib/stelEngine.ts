declare global {
  interface Window {
    StelWebEngine?: (opts: StelInitOptions) => unknown;
    Date: typeof Date & { prototype: Date & { getMJD?: () => number } };
  }
}

export interface StelInitOptions {
  wasmFile: string;
  canvas: HTMLCanvasElement;
  translateFn?: (domain: string, str: string) => string;
  onReady: (stel: StelEngine) => void;
}

export interface StelObserver {
  utc: number;
  latitude: number;
  longitude: number;
  elevation: number;
  yaw: number;
  pitch: number;
}

export interface StelObject {
  designations(): string[];
  getInfo(key: string): number | number[] | undefined;
  computeVisibility(): Array<{ rise: number | null; set: number | null }>;
}

interface ModuleToggle {
  visible: boolean;
}

interface ConstellationsModule {
  lines_visible: boolean;
  visible: boolean;
}

interface DataSourceTarget {
  addDataSource(opts: { url: string; key?: string }): void;
}

export interface StelEngine {
  core: {
    observer: StelObserver;
    selection: StelObject | 0 | null;
    fov: number;
    time_speed: number;
    atmosphere: ModuleToggle & DataSourceTarget;
    landscapes: ModuleToggle & DataSourceTarget;
    constellations: ConstellationsModule;
    lines: {
      azimuthal: ModuleToggle;
      equatorial: ModuleToggle;
      meridian?: ModuleToggle;
    };
    dsos: ModuleToggle & DataSourceTarget;
    dss: ModuleToggle & DataSourceTarget;
    milkyway: ModuleToggle & DataSourceTarget;
    stars: ModuleToggle & DataSourceTarget;
    planets: ModuleToggle & DataSourceTarget;
    skycultures: DataSourceTarget;
    minor_planets: DataSourceTarget;
    comets: DataSourceTarget;
    satellites: DataSourceTarget;
    progressbars: Array<{ label: string; value: number; total: number }>;
  };
  change(cb: (obj: unknown, attr: string) => void): void;
  onValueChanged(cb: (path: string, value: unknown) => void): void;
  convertFrame(obs: StelObserver, from: string, to: string, vec: number[]): number[];
  c2s(vec: number[]): number[];
  anp(angle: number): number;
  anpm(angle: number): number;
  a2tf(angle: number, precision: number): { hours: number; minutes: number; seconds: number; fraction: number };
  a2af(angle: number, precision: number): { sign: string; degrees: number; arcminutes: number; arcseconds: number; fraction: number };
  pointAndLock(obj: StelObject, duration: number): void;
  zoomTo(fov: number, duration: number): void;
  setFont(name: string, url: string, scale: number): void;
  getObj(id: string): StelObject | null;
  createObj(model: string, data: SkySource): StelObject | null;
  createLayer(opts: { id: string; z: number; visible: boolean }): StelLayer;
}

export interface StelLayer {
  add(obj: StelObject): void;
  remove?(obj: StelObject): void;
}

export interface SkySource {
  match?: string;
  short_name?: string;
  model: string;
  model_data?: Record<string, unknown>;
  names: string[];
  types?: string[];
}

const SKYDATA_BASE =
  "https://cdn.jsdelivr.net/gh/Touch-N-Stars/Touch-N-Stars@master/public/stellarium-data";
const ENGINE_SCRIPT_URL = "/stellarium-engine/stellarium-web-engine.js";
const ENGINE_WASM_URL = "/stellarium-engine/stellarium-web-engine.wasm";

let scriptPromise: Promise<void> | null = null;
let selectionLayer: StelLayer | null = null;

function loadScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Stellarium engine requires a browser environment."));
      return;
    }
    if (window.StelWebEngine) {
      resolve();
      return;
    }
    const tag = document.createElement("script");
    tag.src = ENGINE_SCRIPT_URL;
    tag.async = true;
    tag.onload = () => resolve();
    tag.onerror = () => reject(new Error("Failed to load Stellarium engine script."));
    document.head.appendChild(tag);
  });
  return scriptPromise;
}

export async function loadStelEngine(canvas: HTMLCanvasElement): Promise<StelEngine> {
  await loadScript();
  return new Promise<StelEngine>((resolve, reject) => {
    if (!window.StelWebEngine) {
      reject(new Error("StelWebEngine global was not registered after script load."));
      return;
    }
    try {
      window.StelWebEngine({
        wasmFile: ENGINE_WASM_URL,
        canvas,
        translateFn: (_domain, str) => str,
        onReady: (stel) => {
          const engine = stel as StelEngine;
          const c = engine.core;
          c.stars.addDataSource({ url: `${SKYDATA_BASE}/stars` });
          c.skycultures.addDataSource({ url: `${SKYDATA_BASE}/skycultures/western`, key: "western" });
          c.dsos.addDataSource({ url: `${SKYDATA_BASE}/dso` });
          c.dss.addDataSource({ url: `${SKYDATA_BASE}/surveys/dss` });
          c.landscapes.addDataSource({ url: `${SKYDATA_BASE}/landscapes/guereins`, key: "guereins" });
          c.milkyway.addDataSource({ url: `${SKYDATA_BASE}/surveys/milkyway` });
          c.minor_planets.addDataSource({ url: `${SKYDATA_BASE}/mpcorb.dat`, key: "mpc_asteroids" });
          // Planet & solar-system surfaces (HiPS textures keyed by body name)
          const sso = `${SKYDATA_BASE}/surveys/sso`;
          c.planets.addDataSource({ url: `${sso}/sun`, key: "sun" });
          c.planets.addDataSource({ url: `${sso}/moon`, key: "moon" });
          c.planets.addDataSource({ url: `${sso}/mercury`, key: "mercury" });
          c.planets.addDataSource({ url: `${sso}/venus`, key: "venus" });
          c.planets.addDataSource({ url: `${sso}/mars`, key: "mars" });
          c.planets.addDataSource({ url: `${sso}/jupiter`, key: "jupiter" });
          c.planets.addDataSource({ url: `${sso}/saturn`, key: "saturn" });
          c.planets.addDataSource({ url: `${sso}/uranus`, key: "uranus" });
          c.planets.addDataSource({ url: `${sso}/neptune`, key: "neptune" });
          c.planets.addDataSource({ url: `${sso}/io`, key: "io" });
          c.planets.addDataSource({ url: `${sso}/europa`, key: "europa" });
          c.planets.addDataSource({ url: `${sso}/ganymede`, key: "ganymede" });
          c.planets.addDataSource({ url: `${sso}/callisto`, key: "callisto" });
          c.planets.addDataSource({ url: sso, key: "default" });
          c.comets.addDataSource({ url: `${SKYDATA_BASE}/CometEls.txt`, key: "mpc_comets" });
          selectionLayer = engine.createLayer({ id: "luma-selection", z: 50, visible: true });
          resolve(engine);
        },
      });
    } catch (err) {
      reject(err);
    }
  });
}

export function dateToMJD(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5 - 2400000.5;
}

export function mjdToDate(mjd: number): Date {
  return new Date((mjd + 2400000.5 - 2440587.5) * 86400000);
}

export interface SkySourceSearchResult extends SkySource {
  interest?: number;
  shortLabel: string;
  typeLabel: string;
}

const TYPE_LABELS: Record<string, string> = {
  Pla: "Planet",
  DPl: "Dwarf planet",
  MPl: "Minor planet",
  SSO: "Solar system",
  Moo: "Moon",
  Sun: "Sun",
  Com: "Comet",
  Asa: "Satellite",
  Con: "Constellation",
  G: "Galaxy",
  PaG: "Pair of galaxies",
  IG: "Interacting galaxy",
  GrG: "Group of galaxies",
  ClG: "Galaxy cluster",
  QSO: "Quasar",
  OpC: "Open cluster",
  GlC: "Globular cluster",
  "Cl*": "Star cluster",
  PN: "Planetary nebula",
  SNR: "Supernova remnant",
  ISM: "Interstellar matter",
  "**": "Double star",
  "V*": "Variable star",
  "*": "Star",
  dso: "Deep sky object",
};

function labelForType(types: string[] | undefined): string {
  if (!types) return "Object";
  for (const t of types) if (TYPE_LABELS[t]) return TYPE_LABELS[t];
  return "Object";
}

function shortLabel(ss: SkySource): string {
  if (ss.short_name && ss.short_name.length > 0) return ss.short_name;
  const cleaned = (ss.names ?? []).map((n) => n.replace(/^NAME /, ""));
  return cleaned[0] ?? ss.match ?? "Unknown";
}

export async function searchSkySources(query: string, limit = 10): Promise<SkySourceSearchResult[]> {
  if (query.trim().length < 1) return [];
  const url = `/api/skysources?q=${encodeURIComponent(query)}&limit=${limit}`;
  const r = await fetch(url);
  if (!r.ok) return [];
  const data = (await r.json()) as SkySource[];
  if (!Array.isArray(data)) return [];
  return data.map((ss) => ({
    ...ss,
    shortLabel: shortLabel(ss),
    typeLabel: labelForType(ss.types),
  }));
}

async function lookupSkySourceByName(name: string): Promise<SkySource | null> {
  const r = await fetch(`/api/skysources?name=${encodeURIComponent(name)}`);
  if (!r.ok) return null;
  return (await r.json()) as SkySource;
}

function findEngineObject(stel: StelEngine, ss: SkySource): StelObject | null {
  if (ss.model === "constellation") {
    const abbr = (ss.model_data as { iau_abbreviation?: string } | undefined)?.iau_abbreviation;
    if (abbr) {
      const obj = stel.getObj(`CON western ${abbr}`);
      if (obj) return obj;
    }
  }
  if (ss.model === "tle_satellite") {
    const norad = (ss.model_data as { norad_number?: number } | undefined)?.norad_number;
    if (norad !== undefined) {
      const obj = stel.getObj(`NORAD ${norad}`);
      if (obj) return obj;
    }
  }
  for (const name of ss.names ?? []) {
    const obj = stel.getObj(name);
    if (obj) return obj;
    if (name.startsWith("Gaia DR2 ")) {
      const gaia = stel.getObj(name.replace(/^Gaia DR2 /, "GAIA "));
      if (gaia) return gaia;
    }
  }
  return null;
}

export async function selectAndPoint(stel: StelEngine, ss: SkySource): Promise<boolean> {
  // Try by names first (engine may already have planets / catalogued objects loaded)
  let obj = findEngineObject(stel, ss);

  // Re-fetch via the name endpoint to get the canonical sky source (search results
  // are sometimes truncated) — then synthesise an object if the engine doesn't know it.
  if (!obj && ss.match) {
    const canonical = await lookupSkySourceByName(ss.match);
    if (canonical) {
      obj = findEngineObject(stel, canonical);
      if (!obj) {
        obj = stel.createObj(canonical.model, canonical);
        if (obj && selectionLayer) selectionLayer.add(obj);
      }
    }
  }
  if (!obj) {
    obj = stel.createObj(ss.model, ss);
    if (obj && selectionLayer) selectionLayer.add(obj);
  }
  if (!obj) return false;

  (stel.core as { selection: StelObject }).selection = obj;
  try {
    stel.pointAndLock(obj, 1.5);
  } catch {
    // pointAndLock is non-critical
  }
  return true;
}
