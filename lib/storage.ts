import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { env } from "@/lib/env";

export async function saveBase64Asset(input: {
  fileName: string;
  base64: string;
  contentType: string;
}) {
  if (env.STORAGE_MODE !== "local") {
    throw new Error("当前仅启用本地文件存储。");
  }

  const uploadDir = path.resolve(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const extension = input.contentType.split("/")[1] ?? "bin";
  const targetPath = path.join(uploadDir, `${input.fileName}.${extension}`);
  const buffer = Buffer.from(input.base64, "base64");
  await writeFile(targetPath, buffer);

  return {
    url: `/uploads/${path.basename(targetPath)}`,
    mimeType: input.contentType
  };
}
