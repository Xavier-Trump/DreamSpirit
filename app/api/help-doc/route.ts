import { readFile } from "node:fs/promises";
import path from "node:path";

export async function GET() {
  const readmePath = path.join(process.cwd(), "README.md");
  const content = await readFile(readmePath, "utf8");

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8"
    }
  });
}
