import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const NOCTUASKY = "https://api.noctuasky.com/api/v1/skysources";

export const runtime = "nodejs";
export const revalidate = 3600;

const UPSTREAM_HEADERS = { Origin: "https://stellarium-web.org" };
const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
};

async function fetchUpstream<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url, { headers: UPSTREAM_HEADERS, next: { revalidate: 3600 } });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

// Try common name variants so queries like "mars" still hit the /name endpoint
// (it's case-sensitive and prefers "NAME Mars" / "Mars").
function nameCandidates(raw: string): string[] {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return [];
  const titled = trimmed
    .split(/\s+/)
    .map((w) => (w.length === 0 ? w : w[0].toUpperCase() + w.slice(1).toLowerCase()))
    .join(" ");
  const upper = trimmed.toUpperCase();
  const lower = trimmed.toLowerCase();
  const set = new Set([trimmed, titled, upper, lower, `NAME ${titled}`]);
  return [...set];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const name = searchParams.get("name");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10", 10) || 10, 25);

  if (name) {
    for (const candidate of nameCandidates(name)) {
      const hit = await fetchUpstream<unknown>(`${NOCTUASKY}/name/${encodeURIComponent(candidate)}`);
      if (hit) return NextResponse.json(hit, { headers: CACHE_HEADERS });
    }
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (!q || q.length === 0) {
    return NextResponse.json({ error: "missing q or name" }, { status: 400 });
  }

  const searchHits =
    (await fetchUpstream<unknown[]>(`${NOCTUASKY}/?q=${encodeURIComponent(q)}&limit=${limit}`)) ?? [];

  if (searchHits.length > 0) {
    return NextResponse.json(searchHits, { headers: CACHE_HEADERS });
  }

  // Fallback: the upstream /q endpoint misses many common-name queries (Mars, Sirius, …),
  // so probe a few capitalisations against /name in parallel and return whatever sticks.
  const candidates = nameCandidates(q);
  const results = await Promise.all(
    candidates.map((c) => fetchUpstream<unknown>(`${NOCTUASKY}/name/${encodeURIComponent(c)}`)),
  );
  const first = results.find((r) => r !== null);
  if (first) {
    return NextResponse.json([first], { headers: CACHE_HEADERS });
  }
  return NextResponse.json([], { headers: CACHE_HEADERS });
}
