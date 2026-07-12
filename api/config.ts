import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  const UPSTREAM = process.env.LOAD_BALANCER_URL || process.env.SESSION_PROXY_URL;
  res.status(200).json({
    lb: Boolean(process.env.LOAD_BALANCER_URL),
    allowDirect: !UPSTREAM,
  });
}
