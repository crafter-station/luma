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
}

const SKYDATA_BASE =
  "https://cdn.jsdelivr.net/gh/Touch-N-Stars/Touch-N-Stars@master/public/stellarium-data";
const ENGINE_SCRIPT_URL = "/stellarium-engine/stellarium-web-engine.js";
const ENGINE_WASM_URL = "/stellarium-engine/stellarium-web-engine.wasm";

let scriptPromise: Promise<void> | null = null;

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
