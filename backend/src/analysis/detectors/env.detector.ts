import fs from "fs";
import path from "path";

export function detectEnv(repo: string) {
  const required = new Set<string>();

  const example = path.join(repo, ".env.example");
  if (fs.existsSync(example)) {
    fs.readFileSync(example, "utf-8")
      .split("\n")
      .forEach((l) => {
        const key = l.split("=")[0]?.trim();
        if (key) required.add(key);
      });
  }

  return {
    required: [...required],
    optional: [],
  };
}
