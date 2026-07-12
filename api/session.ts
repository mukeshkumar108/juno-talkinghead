import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const UPSTREAM = process.env.LOAD_BALANCER_URL || process.env.SESSION_PROXY_URL;
  if (!UPSTREAM) {
    return res.status(404).json({ error: "Not configured." });
  }

  try {
    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    const cookie = req.headers.cookie;
    if (cookie) headers.set("Cookie", cookie);

    const resp = await fetch(`${UPSTREAM}/session`, {
      method: "POST",
      headers,
      body: "{}"
    });
    
    const body = await resp.json();
    
    // Relay set-cookie headers
    const setCookies = resp.headers.getSetCookie?.() ?? 
      (resp.headers.get("set-cookie") ? [resp.headers.get("set-cookie") as string] : []);
    for (const sc of setCookies) {
      const sanitized = sc.split(";").map(p => p.trim()).filter(p => !/^domain=/i.test(p)).join("; ");
      res.appendHeader("Set-Cookie", sanitized);
    }

    res.status(resp.status).json(body);
  } catch (err) {
    console.warn("session handshake failed:", err);
    res.status(502).json({ error: "Speech service unreachable." });
  }
}
