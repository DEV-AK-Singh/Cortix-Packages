import fg from "fast-glob"
import path from "path"
import fs from "fs/promises"
import { Detector, DetectorResult } from "./base"
import { EnvServiceInfo, EnvVarInfo } from "./types"
import { ANALYSIS_IGNORE } from "./constants"

export const ENVVarDetector: Detector<EnvServiceInfo[]> = {
  name: "ENVVarDetector",

  async detect(repoPath: string): Promise<DetectorResult<EnvServiceInfo[]>> {
    try {
      const results: EnvServiceInfo[] = []
      const normalizedRepoPath = repoPath.split(path.sep).join("/")

      /* ---------------------------------------------
         1. Find service roots (Deep 5 for monorepos)
      ---------------------------------------------- */
      const serviceFiles = await fg(
        [
          "**/package.json",
          "**/requirements.txt",
          "**/pyproject.toml",
          "**/go.mod",
          "**/pom.xml",
          "**/build.gradle",
        ],
        {
          cwd: normalizedRepoPath,
          deep: 5,
          ignore: ANALYSIS_IGNORE,
          absolute: true,
        }
      )

      if (serviceFiles.length === 0) {
        return { success: false, warnings: ["No service roots found"] }
      }

      const uniqueRoots = [...new Set(serviceFiles.map(f => path.dirname(f)))]

      /* ---------------------------------------------
         2. Scan each service
      ---------------------------------------------- */
      for (const servicePath of uniqueRoots) {
        const declared = new Map<string, EnvVarInfo>()
        const used = new Map<string, EnvVarInfo>()
        const relativePath = path.relative(repoPath, servicePath) || "."
        const normalizedServicePath = servicePath.split(path.sep).join("/")

        /* ---------- 2a. .env files (Declared) ---------- */
        const envFiles = await fg(
          [".env", ".env.*", ".env.example"],
          {
            cwd: normalizedServicePath,
            deep: 1,
            absolute: true,
          }
        )

        for (const file of envFiles) {
          try {
            const content = await fs.readFile(file, "utf-8")
            content.split(/\r?\n/).forEach(line => {
              // Matches: VAR_NAME=value or export VAR_NAME=value (ignoring comments)
              const match = line.match(/^\s*(?:export\s+)?([A-Z_][A-Z0-9_]*)\s*=/)
              if (match) {
                declared.set(match[1], {
                  name: match[1],
                  source: "env-file",
                  confidence: 1.0,
                })
              }
            })
          } catch (e) { /* Skip unreadable files */ }
        }

        /* ---------- 2b. Code usage (Used) ---------- */
        const codeFiles = await fg(
          ["**/*.{js,ts,jsx,tsx,py,go,java}"],
          {
            cwd: normalizedServicePath,
            deep: 5,
            absolute: true,
            ignore: ["**/node_modules/**", "**/dist/**", "**/build/**", "**/tests/**"],
          }
        )

        for (const file of codeFiles) {
          try {
            const content = await fs.readFile(file, "utf-8")

            const patterns = [
              /process\.env\.([A-Z_][A-Z0-9_]*)/g,               // Node dot notation
              /process\.env\[['"`]([A-Z_][A-Z0-9_]*)['"`]\]/g,   // Node bracket notation
              /os\.(?:environ(?:(?:\.get\(|\[))|getenv\()['"']([A-Z_][A-Z0-9_]*)['"']/g, // Python
              /System\.getenv\(['"]([A-Z_][A-Z0-9_]*)['"]\)/g,   // Java
              /os\.Getenv\(['"]([A-Z_][A-Z0-9_]*)['"]\)/g,       // Go
            ]

            for (const regex of patterns) {
              let match
              while ((match = regex.exec(content)) !== null) {
                // match[1] is the captured variable name
                used.set(match[1], {
                  name: match[1],
                  source: "code",
                  confidence: 0.9,
                })
              }
            }
          } catch (e) { /* Skip unreadable files */ }
        }

        if (declared.size > 0 || used.size > 0) {
          results.push({
            path: servicePath,
            relativePath,
            declared: [...declared.values()],
            used: [...used.values()],
          })
        }
      }

      return results.length > 0
        ? { success: true, data: results }
        : { success: false, warnings: ["No environment variables detected"] }

    } catch (error: any) {
      return {
        success: false,
        warnings: [`ENV detection failed: ${error.message}`],
      }
    }
  }
}

async function exists(filePath: string) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}