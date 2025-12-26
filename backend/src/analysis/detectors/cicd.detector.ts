import fg from "fast-glob"
import path from "path"
import { Detector, DetectorResult } from "./base"
import { CICDInfo } from "./types"

export const CICDDetector: Detector<CICDInfo[]> = {
  name: "CICDDetector",

  async detect(repoPath: string): Promise<DetectorResult<CICDInfo[]>> {
    try {
      const providerMap = new Map<CICDInfo["provider"], CICDInfo>()
      const normalizedRepoPath = repoPath.split(path.sep).join("/")

      /* ---------------------------------------------
         1. Discover CI/CD config files
      ---------------------------------------------- */
      const files = await fg(
        [
          ".github/workflows/**/*.{yml,yaml}",
          ".gitlab-ci.yml",
          ".circleci/config.yml",
          "azure-pipelines.{yml,yaml}",
          "Jenkinsfile",
          ".travis.yml",
        ],
        {
          cwd: normalizedRepoPath,
          deep: 3, // CI/CD files are usually near the root
          absolute: true,
          ignore: ["**/node_modules/**", "**/.git/**"],
        }
      )

      if (files.length === 0) {
        return {
          success: false,
          warnings: ["No CI/CD configuration found"],
        }
      }

      /* ---------------------------------------------
         2. Group and Detect Providers
      ---------------------------------------------- */
      for (const file of files) {
        const relativeFilePath = path.relative(repoPath, file).replace(/\\/g, "/")
        let provider: CICDInfo["provider"] = "unknown"
        let confidence = 0.6

        if (relativeFilePath.startsWith(".github/workflows")) {
          provider = "github-actions"
          confidence = 1.0
        } else if (relativeFilePath === ".gitlab-ci.yml") {
          provider = "gitlab-ci"
          confidence = 1.0
        } else if (relativeFilePath.startsWith(".circleci")) {
          provider = "circleci"
          confidence = 1.0
        } else if (relativeFilePath.toLowerCase().includes("azure-pipelines")) {
          provider = "azure-pipelines"
          confidence = 1.0
        } else if (relativeFilePath.includes("Jenkinsfile")) {
          // Note: Add "jenkins" to your Provider type if needed
          provider = "unknown" 
          confidence = 0.9 
        }

        // Grouping logic: merge files under the same provider
        const existing = providerMap.get(provider)
        if (existing) {
          existing.configFiles.push(path.basename(file))
          existing.indicators.push(relativeFilePath)
        } else {
          providerMap.set(provider, {
            provider,
            configFiles: [path.basename(file)],
            indicators: [relativeFilePath],
            path: path.dirname(file),
            relativePath: path.dirname(relativeFilePath) || ".",
            confidence,
          })
        }
      }

      return {
        success: true,
        data: Array.from(providerMap.values()),
      }

    } catch (error: any) {
      return {
        success: false,
        warnings: [`CI/CD detection failed: ${error.message}`],
      }
    }
  },
}