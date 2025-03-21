import { readdir } from "fs/promises";
import path from "path";

import { type Result, exit } from "bun-err";

export async function walkDir(
  dir: string,
  callback: (isDir: boolean, path: string) => void
): Promise<Result<null>> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      await callback(entry.isDirectory(), fullPath);
      if (entry.isDirectory()) {
        await walkDir(fullPath, callback);
      }
    }
    return exit.ok(null)
  } catch (e: any) {
    return exit.err(e)
  }
}