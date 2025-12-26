import fs from "fs/promises"
import path from "path"
import fg from "fast-glob"
import { Detector, DetectorResult } from "./base"
import { FrameworkInfo } from "./types"
import { ANALYSIS_IGNORE } from "./constants"

export const FrameworkDetector: Detector<FrameworkInfo[]> = {
  name: "FrameworkDetector",

  async detect(repoPath: string): Promise<DetectorResult<FrameworkInfo[]>> {
    try {
      const allDetectedFrameworks: FrameworkInfo[] = []
      const normalizedRepoPath = repoPath.split(path.sep).join("/")

      const files = await fg(
        [
          "**/package.json",
          "**/next.config.{js,mjs,ts}",
          "**/nest-cli.json",
          "**/manage.py",
          "**/pyproject.toml",
          "**/requirements.txt",
          "**/go.mod",
          "**/pom.xml"
        ],
        {
          cwd: normalizedRepoPath,
          deep: 5,
          ignore: ANALYSIS_IGNORE,
          absolute: true
        }
      )

      const byDir = new Map<string, Set<string>>()
      for (const file of files) {
        const dir = path.dirname(file)
        const name = path.basename(file)
        if (!byDir.has(dir)) byDir.set(dir, new Set())
        byDir.get(dir)!.add(name)
      }

      for (const [servicePath, fileSet] of byDir.entries()) {
        const relativePath = path.relative(repoPath, servicePath) || "."
        
        // Use a Map per directory to prevent duplicate framework entries for the same service
        // e.g., prevents FastAPI being added twice if it's in both requirements.txt and pyproject.toml
        const dirFrameworks = new Map<string, FrameworkInfo>()

        /* ---------------- NODE (Frontend & Backend) ---------------- */
        if (fileSet.has("package.json")) {
          const pkg = JSON.parse(await fs.readFile(path.join(servicePath, "package.json"), "utf-8"))
          const deps = { ...pkg.dependencies, ...pkg.devDependencies }

          if (deps?.next || fileSet.has("next.config.js")) {
            dirFrameworks.set("Next.js", { name: "Next.js", confidence: 0.95, indicators: ["package.json"], path: servicePath, relativePath })
          }
          if (deps?.react && !deps?.next) {
            dirFrameworks.set("React", { name: "React", confidence: 0.9, indicators: ["package.json"], path: servicePath, relativePath })
          }
          if (deps?.["@nestjs/core"] || fileSet.has("nest-cli.json")) {
            dirFrameworks.set("NestJS", { name: "NestJS", confidence: 0.9, indicators: ["package.json"], path: servicePath, relativePath })
          }
          if (deps?.express) {
            dirFrameworks.set("Express", { name: "Express", confidence: 0.8, indicators: ["package.json"], path: servicePath, relativePath })
          }
        }

        /* ---------------- PYTHON ---------------- */
        if (fileSet.has("manage.py")) {
          dirFrameworks.set("Django", { name: "Django", confidence: 0.95, indicators: ["manage.py"], path: servicePath, relativePath })
        }

        for (const f of ["requirements.txt", "pyproject.toml"]) {
          if (fileSet.has(f)) {
            const content = (await fs.readFile(path.join(servicePath, f), "utf-8")).toLowerCase()
            if (content.includes("fastapi")) 
              dirFrameworks.set("FastAPI", { name: "FastAPI", confidence: 0.9, indicators: [f], path: servicePath, relativePath })
            if (content.includes("flask")) 
              dirFrameworks.set("Flask", { name: "Flask", confidence: 0.8, indicators: [f], path: servicePath, relativePath })
          }
        }

        /* ---------------- GO & JAVA ---------------- */
        if (fileSet.has("go.mod")) {
          const content = await fs.readFile(path.join(servicePath, "go.mod"), "utf-8")
          if (content.includes("gin-gonic/gin")) dirFrameworks.set("Gin", { name: "Gin", confidence: 0.9, indicators: ["go.mod"], path: servicePath, relativePath })
        }

        if (fileSet.has("pom.xml")) {
          const content = await fs.readFile(path.join(servicePath, "pom.xml"), "utf-8")
          if (content.includes("spring-boot")) dirFrameworks.set("Spring Boot", { name: "Spring Boot", confidence: 0.9, indicators: ["pom.xml"], path: servicePath, relativePath })
        }

        // Add all unique frameworks found in this folder to the global results
        allDetectedFrameworks.push(...Array.from(dirFrameworks.values()))
      }

      return allDetectedFrameworks.length
        ? { success: true, data: allDetectedFrameworks }
        : { success: false, warnings: ["No frameworks detected"] }

    } catch (error: any) {
      return { success: false, warnings: [`Framework detection failed: ${error.message}`] }
    }
  }
}