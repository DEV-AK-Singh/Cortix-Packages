import fs from "fs";

export function safeExists(path: string): boolean {
  try {
    return fs.existsSync(path);
  } catch {
    return false;
  }
}

export function safeReadJSON(path: string): any | null {
  try {
    if (!safeExists(path)) return null;
    return JSON.parse(fs.readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}
