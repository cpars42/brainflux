import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body as { url?: string };

    if (!url || typeof url !== "string" || !url.startsWith("http")) {
      return Response.json({ error: "Invalid url" }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; BrainFlux/1.0; +https://brainflux.loot42.com)",
          Accept: "text/html",
        },
      });
      clearTimeout(timeout);

      const html = await res.text();
      const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const raw = match ? match[1].trim() : null;
      // Decode HTML entities (basic)
      const title = raw
        ? raw.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#039;/g, "'").replace(/&quot;/g, '"').slice(0, 120)
        : null;

      return Response.json({ title, url });
    } catch {
      clearTimeout(timeout);
      return Response.json({ title: null, url });
    }
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
