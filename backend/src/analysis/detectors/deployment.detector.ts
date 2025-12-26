import fg from "fast-glob"
import path from "path"
import { Detector, DetectorResult } from "./base"
import { DeploymentInfo } from "./types"

export const DeploymentDetector: Detector<DeploymentInfo[]> = {
  name: "DeploymentDetector",

  async detect(repoPath: string): Promise<DetectorResult<DeploymentInfo[]>> {
    try {
      const providerMap = new Map<DeploymentInfo["provider"], DeploymentInfo>()
      const normalizedRepoPath = repoPath.split(path.sep).join("/")

      /* ---------------------------------------------
         1. Discover all deployment config files
      ---------------------------------------------- */
      const files = await fg(
        [
          "vercel.json",
          ".vercel/**",
          "netlify.to{ml,l}",
          "railway.{json,toml}",
          "render.yaml",
          "fly.toml",
          "serverless.{yml,yaml}",
          "cdk.json",
          "app.yaml",
          "azure-pipelines.{yml,yaml}",
          "main.tf",         // Terraform (General IaC)
          "k8s/**/*.yaml",   // Kubernetes
          "kubernetes/**/*.yaml"
        ],
        {
          cwd: normalizedRepoPath,
          deep: 4,
          absolute: true,
          ignore: ["**/node_modules/**", "**/.git/**", "**/dist/**"],
        }
      )

      if (files.length === 0) {
        return {
          success: false,
          warnings: ["No deployment configuration detected"],
        }
      }

      /* ---------------------------------------------
         2. Analyze and Group by Provider
      ---------------------------------------------- */
      for (const file of files) {
        // Use forward slashes for cross-platform string matching
        const rel = path.relative(repoPath, file).replace(/\\/g, "/")
        const baseName = path.basename(file)
        
        let provider: DeploymentInfo["provider"] = "unknown"
        let confidence = 0.6

        if (rel.includes("vercel")) {
          provider = "vercel"
          confidence = 0.95
        } else if (rel.includes("netlify")) {
          provider = "netlify"
          confidence = 0.95
        } else if (rel.includes("railway")) {
          provider = "railway"
          confidence = 0.95
        } else if (rel === "render.yaml") {
          provider = "render"
          confidence = 0.95
        } else if (rel === "fly.toml") {
          provider = "flyio"
          confidence = 0.95
        } else if (rel.includes("serverless") || rel === "cdk.json") {
          provider = "aws"
          confidence = 0.9 // High, though serverless can be used for others
        } else if (rel === "app.yaml") {
          provider = "gcp"
          confidence = 0.85
        } else if (rel.includes("azure")) {
          provider = "azure"
          confidence = 0.9
        }

        // Grouping Logic
        const existing = providerMap.get(provider)
        if (existing) {
          existing.indicators.push(rel)
          if (existing.configFiles && !existing.configFiles.includes(baseName)) {
            existing.configFiles.push(baseName)
          }
        } else {
          providerMap.set(provider, {
            provider,
            indicators: [rel],
            configFiles: [baseName],
            path: path.dirname(file),
            relativePath: path.dirname(rel) || ".",
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
        warnings: [`Deployment detection failed: ${error.message}`],
      }
    }
  },
}