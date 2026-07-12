import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const UPSTREAM = process.env.LOAD_BALANCER_URL || process.env.SESSION_PROXY_URL;
  if (!UPSTREAM) {
    return res.status(404).json({ error: "Not configured." });
  }

  const { id } = req.query;
  const path = `/queue/${encodeURIComponent(id as string)}`;

  try {
    const headers = new Headers();
    const cookie = req.headers.cookie;
    if (cookie) headers.set("Cookie", cookie);

    const resp = await fetch(`${UPSTREAM}${path}`, {
      method: req.method,
      headers
    });
    
    const body = await resp.json();
    res.status(resp.status).json(body);
  } catch (err) {
    res.status(502).json({ error: "Speech service unreachable." });
  }
}
