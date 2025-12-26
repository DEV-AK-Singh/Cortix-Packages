import fg from "fast-glob"
import path from "path"
import { APIStyleInfo } from "./types" 
import { Detector, DetectorResult } from "./base"
import { ANALYSIS_IGNORE } from "./constants"

export const APIStyleDetector: Detector<APIStyleInfo[]> = {
  name: "APIStyleDetector",

  async detect(repoPath: string): Promise<DetectorResult<APIStyleInfo[]>> {
    try {
      const results: APIStyleInfo[] = []
      const normalizedRepoPath = repoPath.split(path.sep).join("/")

      /* -------------------------------------------------
         1. Discover Service Roots
      -------------------------------------------------- */
      const serviceFiles = await fg(
        [
          "**/package.json",
          "**/requirements.txt",
          "**/pyproject.toml",
          "**/go.mod",
          "**/pom.xml",
        ],
        {
          cwd: normalizedRepoPath,
          deep: 5,
          ignore: ANALYSIS_IGNORE,
          absolute: true
        }
      )

      const roots = new Set(serviceFiles.map(f => path.dirname(f)))

      /* -------------------------------------------------
         2. Detect Styles per Directory
      -------------------------------------------------- */
      for (const absPath of roots) {
        const relativePath = path.relative(repoPath, absPath) || "."
        let stylesFoundInDir = 0

        // Helper for local globbing
        const checkExists = async (patterns: string[]) => {
          const found = await fg(patterns, {
            cwd: absPath.split(path.sep).join("/"),
            deep: 3,
            onlyFiles: true
          })
          return found.length > 0
        }

        // ---------- GraphQL ----------
        if (await checkExists(["**/*.graphql", "**/*.gql", "**/schema.{ts,js,graphql}"])) {
          results.push({
            style: "graphql",
            confidence: 0.9,
            indicators: ["graphql schema files"],
            path: absPath,
            relativePath
          })
          stylesFoundInDir++
        }

        // ---------- gRPC ----------
        if (await checkExists(["**/*.proto"])) {
          results.push({
            style: "grpc",
            confidence: 0.9,
            indicators: [".proto files"],
            path: absPath,
            relativePath
          })
          stylesFoundInDir++
        }

        // ---------- REST ----------
        if (await checkExists(["**/routes/**", "**/controllers/**", "**/*controller.*", "**/*route.*", "**/openapi.yaml", "**/swagger.json"])) {
          results.push({
            style: "rest",
            confidence: 0.8,
            indicators: ["RESTful patterns (routes/controllers/openapi/etc.)"],
            path: absPath,
            relativePath
          })
          stylesFoundInDir++
        }

        // ---------- RPC (tRPC / JSON-RPC) ----------
        if (await checkExists(["**/trpc/**", "**/rpc/**", "**/procedures/**"])) {
          results.push({
            style: "rpc",
            confidence: 0.85,
            indicators: ["RPC procedure patterns"],
            path: absPath,
            relativePath
          })
          stylesFoundInDir++
        }

        // ---------- Fallback ----------
        if (stylesFoundInDir === 0) {
          results.push({
            style: "none",
            confidence: 0.5,
            indicators: ["No specific API patterns found"],
            path: absPath,
            relativePath
          })
        }
      }

      return {
        success: true,
        data: results
      }

    } catch (error: any) {
      return {
        success: false,
        warnings: [`API Style detection failed: ${error.message}`]
      }
    }
  }
}