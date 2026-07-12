import type { VercelRequest, VercelResponse } from "@vercel/node";
import fs from "fs";
import path from "path";

export default function handler(req: VercelRequest, res: VercelResponse) {
  const filePath = path.join(process.cwd(), "persona.md");
  const fileContent = fs.readFileSync(filePath, "utf8");
  res.setHeader("Content-Type", "text/markdown");
  res.status(200).send(fileContent);
}
