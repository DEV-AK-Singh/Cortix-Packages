import fg from "fast-glob"
import path from "path"
import fs from "fs/promises"
import { Detector, DetectorResult } from "./base"
import { ContainerizationInfo } from "./types"

export const ContainerizationDetector: Detector<ContainerizationInfo[]> = {
  name: "ContainerizationDetector",

  async detect(repoPath: string): Promise<DetectorResult<ContainerizationInfo[]>> {
    try {
      const results: ContainerizationInfo[] = []
      const normalizedRepoPath = repoPath.split(path.sep).join("/")

      /* ---------------------------------------------
         1. Discover all Docker-related files
      ---------------------------------------------- */
      const dockerFiles = await fg(
        [
          "**/Dockerfile*",
          "**/dockerfile*",
          "**/docker-compose.yml",
          "**/docker-compose.yaml",
          "**/.dockerignore",
        ],
        {
          cwd: normalizedRepoPath,
          deep: 5,
          absolute: true,
          ignore: ["**/node_modules/**", "**/.git/**", "**/dist/**"],
        }
      )

      if (dockerFiles.length === 0) {
        return {
          success: true,
          data: [{
            containerized: false,
            strategy: "generated",
            indicators: [],
            confidence: 0.9,
            path: repoPath,
            relativePath: ".",
          }],
        }
      }

      /* ---------------------------------------------
         2. Group by directory (service-aware)
      ---------------------------------------------- */
      const byDir = new Map<string, string[]>()
      for (const file of dockerFiles) {
        const dir = path.dirname(file)
        if (!byDir.has(dir)) byDir.set(dir, [])
        byDir.get(dir)!.push(path.basename(file))
      }

      /* ---------------------------------------------
         3. Analyze containerization per directory
      ---------------------------------------------- */
      for (const [servicePath, files] of byDir.entries()) {
        const relativePath = path.relative(repoPath, servicePath) || "."
        
        const dockerfiles = files.filter(f => f.toLowerCase().includes("dockerfile"))
        const composeFiles = files.filter(f => f.startsWith("docker-compose"))
        const indicators = [...files]

        let strategy: ContainerizationInfo["strategy"] = "partial"
        let confidence = 0.5

        if (dockerfiles.length > 0 && composeFiles.length > 0) {
          strategy = "existing"
          confidence = 0.98
        } else if (dockerfiles.length > 0) {
          strategy = "existing"
          confidence = 0.9
        } else if (composeFiles.length > 0) {
          strategy = "partial"
          confidence = 0.7
        }

        // Extract service names from Docker Compose
        const detectedServices = new Set<string>()
        for (const compose of composeFiles) {
          try {
            const content = await fs.readFile(path.join(servicePath, compose), "utf-8")
            // Improved regex to find service names under the 'services:' key
            // Looks for indentation and keys ending in colon
            const lines = content.split(/\r?\n/)
            let inServicesBlock = false
            
            for (const line of lines) {
              if (line.trim() === "services:") {
                inServicesBlock = true
                continue
              }
              // If we find a top-level key that isn't services, we might have left the block
              if (inServicesBlock && line.match(/^[^\s]/)) inServicesBlock = false
              
              if (inServicesBlock) {
                const match = line.match(/^\s{2,4}([a-zA-Z0-9_-]+):/)
                if (match) detectedServices.add(match[1])
              }
            }
          } catch (e) { /* skip unreadable files */ }
        }

        results.push({
          containerized: dockerfiles.length > 0 || composeFiles.length > 0,
          strategy,
          dockerfiles: dockerfiles.length > 0 ? dockerfiles : undefined,
          composeFiles: composeFiles.length > 0 ? composeFiles : undefined,
          services: detectedServices.size > 0 ? [...detectedServices] : undefined,
          indicators,
          path: servicePath,
          relativePath,
          confidence,
        })
      }

      return { success: true, data: results }

    } catch (error: any) {
      return {
        success: false,
        warnings: [`Containerization detection failed: ${error.message}`],
      }
    }
  },
}