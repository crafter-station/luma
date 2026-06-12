import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const NOCTUASKY = "https://api.noctuasky.com/api/v1/skysources";

export const runtime = "nodejs";
export const revalidate = 3600;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const name = searchParams.get("name");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10", 10) || 10, 25);

  let upstream: string;
  if (name) {
    upstream = `${NOCTUASKY}/name/${encodeURIComponent(name)}`;
  } else if (q && q.length > 0) {
    upstream = `${NOCTUASKY}/?q=${encodeURIComponent(q)}&limit=${limit}`;
  } else {
    return NextResponse.json({ error: "missing q or name" }, { status: 400 });
  }

  try {
    const r = await fetch(upstream, {
      headers: { Origin: "https://stellarium-web.org" },
      next: { revalidate: 3600 },
    });
    if (!r.ok) {
      return NextResponse.json({ error: `upstream ${r.status}` }, { status: r.status });
    }
    const data = await r.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
