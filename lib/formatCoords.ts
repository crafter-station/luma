import type { StelEngine, StelObject, StelObserver } from "./stelEngine";

function pad(n: number, width: number) {
  const s = `${Math.abs(n)}`;
  return s.length >= width ? s : "0".repeat(width - s.length) + s;
}

export function formatRA(stel: StelEngine, radians: number): string {
  const t = stel.a2tf(radians, 1);
  return `${pad(t.hours, 2)}h ${pad(t.minutes, 2)}m ${pad(t.seconds, 2)}.${t.fraction}s`;
}

export function formatDec(stel: StelEngine, radians: number): string {
  const a = stel.a2af(radians, 1);
  return `${a.sign}${pad(a.degrees, 2)}° ${pad(a.arcminutes, 2)}′ ${pad(a.arcseconds, 2)}.${a.fraction}″`;
}

export function formatAz(stel: StelEngine, radians: number): string {
  const a = stel.a2af(radians, 1);
  const deg = a.degrees < 0 ? a.degrees + 180 : a.degrees;
  return `${pad(deg, 3)}° ${pad(a.arcminutes, 2)}′ ${pad(a.arcseconds, 2)}.${a.fraction}″`;
}

export interface ObjectSummary {
  title: string;
  designations: string[];
  magnitude: number | null;
  ra: string;
  dec: string;
  az: string;
  alt: string;
  rise: string | null;
  set: string | null;
  visibilityNote: string;
}

function cleanName(raw: string): string {
  return raw.replace(/^NAME /, "");
}

function formatClock(mjd: number): string {
  const ms = (mjd + 2400000.5 - 2440587.5) * 86400000;
  const d = new Date(ms);
  return `${pad(d.getUTCHours(), 2)}:${pad(d.getUTCMinutes(), 2)}`;
}

export function summarizeObject(stel: StelEngine, obj: StelObject): ObjectSummary {
  const observer: StelObserver = stel.core.observer;
  const radec = obj.getInfo("radec");
  const vmag = obj.getInfo("vmag");

  let ra = "—";
  let dec = "—";
  let az = "—";
  let alt = "—";

  if (Array.isArray(radec)) {
    const posJNow = stel.convertFrame(observer, "ICRF", "JNOW", radec);
    const sJNow = stel.c2s(posJNow);
    ra = formatRA(stel, stel.anp(sJNow[0]));
    dec = formatDec(stel, stel.anpm(sJNow[1]));

    const obs = stel.c2s(stel.convertFrame(observer, "ICRF", "OBSERVED", radec));
    az = formatAz(stel, stel.anp(obs[0]));
    alt = formatDec(stel, stel.anpm(obs[1]));
  }

  let rise: string | null = null;
  let setStr: string | null = null;
  let visibilityNote = "";
  try {
    const vis = obj.computeVisibility();
    if (!vis || vis.length === 0) {
      visibilityNote = "Not visible tonight";
    } else if (vis[0].rise === null) {
      visibilityNote = "Always visible tonight";
    } else {
      rise = formatClock(vis[0].rise);
      setStr = vis[0].set === null ? null : formatClock(vis[0].set);
      visibilityNote = `Rise: ${rise}   Set: ${setStr ?? "—"}`;
    }
  } catch {
    visibilityNote = "—";
  }

  const designations = (obj.designations() || []).map(cleanName);
  const title = designations[0] ?? "Selection";

  return {
    title,
    designations,
    magnitude: typeof vmag === "number" && !Number.isNaN(vmag) ? vmag : null,
    ra,
    dec,
    az,
    alt,
    rise,
    set: setStr,
    visibilityNote,
  };
}
