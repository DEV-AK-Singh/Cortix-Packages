import fg from "fast-glob"
import path from "path"
import fs from "fs/promises"
import { Detector, DetectorResult } from "./base"
import { EntryPointInfo } from "./types"

export const EntryPointDetector: Detector<EntryPointInfo[]> = {
  name: "EntryPointDetector",

  async detect(repoPath: string): Promise<DetectorResult<EntryPointInfo[]>> {
    try {
      const results: EntryPointInfo[] = []
      
      // 1. Normalize path for fast-glob compatibility
      const normalizedRepoPath = repoPath.split(path.sep).join("/")

      /* -------------------------------------------------
         1. Discover Service Roots (Increased depth to 5)
      -------------------------------------------------- */
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
          ignore: ["**/node_modules/**", "**/.git/**", "**/dist/**"],
          absolute: true,
        }
      )

      if (serviceFiles.length === 0) {
        return {
          success: false,
          warnings: ["No service roots found for entry point detection"],
        }
      }

      const serviceRoots = new Set(serviceFiles.map((f) => path.dirname(f)))

      /* -------------------------------------------------
         2. Analyze each Service Root
      -------------------------------------------------- */
      for (const servicePath of serviceRoots) {
        const relativePath = path.relative(repoPath, servicePath) || "."
        const normalizedServicePath = servicePath.split(path.sep).join("/")

        // ---------- NODE ----------
        const pkgPath = path.join(servicePath, "package.json")
        if (await exists(pkgPath)) {
          const pkg = JSON.parse(await fs.readFile(pkgPath, "utf-8"))
          
          // Determine package manager for command accuracy
          const hasYarn = await exists(path.join(servicePath, "yarn.lock"))
          const hasPnpm = await exists(path.join(servicePath, "pnpm-lock.yaml"))
          const pm = hasPnpm ? "pnpm" : hasYarn ? "yarn" : "npm"

          if (pkg.scripts?.start) {
            results.push({
              runtime: "node",
              entryType: "script",
              command: `${pm} run start`,
              path: servicePath,
              relativePath,
              confidence: 0.95,
            })
          } else if (pkg.main) {
            results.push({
              runtime: "node",
              entryType: "script",
              file: pkg.main,
              command: `node ${pkg.main}`,
              path: servicePath,
              relativePath,
              confidence: 0.85,
            })
          }
        }

        // ---------- PYTHON ----------
        // Check for common entry files
        const pyEntry = await fg(
          ["main.py", "app.py", "wsgi.py", "asgi.py", "run.py"],
          { cwd: normalizedServicePath, deep: 1 }
        )

        if (pyEntry.length > 0) {
          results.push({
            runtime: "python",
            entryType: "script",
            file: pyEntry[0],
            command: `python ${pyEntry[0]}`,
            path: servicePath,
            relativePath,
            confidence: 0.85,
          })
        }

        // ---------- GO ----------
        if (await exists(path.join(servicePath, "go.mod"))) {
          results.push({
            runtime: "go",
            entryType: "binary",
            command: "go run .",
            path: servicePath,
            relativePath,
            confidence: 0.9,
          })
        }

        // ---------- JAVA ----------
        if (
          (await exists(path.join(servicePath, "pom.xml"))) ||
          (await exists(path.join(servicePath, "build.gradle")))
        ) {
          results.push({
            runtime: "java",
            entryType: "framework",
            command: "java -jar target/*.jar",
            path: servicePath,
            relativePath,
            confidence: 0.75,
          })
        }
      }

      return results.length > 0
        ? { success: true, data: results }
        : { success: false, warnings: ["Entry points could not be determined"] }
        
    } catch (err: any) {
      return {
        success: false,
        warnings: [`EntryPoint detection failed: ${err.message}`],
      }
    }
  },
}

// ---------- helper ----------
async function exists(filePath: string) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}