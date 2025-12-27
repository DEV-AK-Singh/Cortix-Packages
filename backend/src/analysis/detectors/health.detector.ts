import fg from "fast-glob"
import path from "path"
import fs from "fs/promises"
import { Detector, DetectorResult } from "./base"
import { HealthInfo } from "./types"

export const HealthDetector: Detector<HealthInfo[]> = {
  name: "HealthDetector",

  async detect(repoPath: string): Promise<DetectorResult<HealthInfo[]>> {
    try {
      const results: HealthInfo[] = []
      const normalizedRepoPath = repoPath.split(path.sep).join("/")

      // 1. Check for Root-level assets (inherited by services)
      const rootReadme = await fg(["README.md", "README"], { cwd: normalizedRepoPath, caseSensitiveMatch: false })
      const rootLicense = await fg(["LICENSE", "LICENSE.md"], { cwd: normalizedRepoPath, caseSensitiveMatch: false })

      // 2. Detect service roots
      const serviceFiles = await fg(
        ["**/package.json", "**/requirements.txt", "**/pyproject.toml", "**/go.mod"],
        {
          cwd: normalizedRepoPath,
          deep: 5,
          absolute: true,
          ignore: ["**/node_modules/**", "**/.git/**"],
        }
      )

      const uniqueRoots = [...new Set(serviceFiles.map(p => path.dirname(p)))]

      for (const servicePath of uniqueRoots) {
        const indicators: string[] = []
        const relativePath = path.relative(repoPath, servicePath) || "."
        let score = 100

        /* ---------- README ---------- */
        const localReadme = await fg(["README.md", "README"], { cwd: servicePath, caseSensitiveMatch: false })
        const hasReadme = localReadme.length > 0 || (rootReadme.length > 0 && relativePath === ".")
        if (!hasReadme) score -= 15
        else indicators.push("has-readme")

        /* ---------- LICENSE ---------- */
        const localLicense = await fg(["LICENSE", "LICENSE.md"], { cwd: servicePath, caseSensitiveMatch: false })
        const hasLicense = localLicense.length > 0 ? localLicense[0] : (rootLicense.length > 0 ? "root-inherited" : false)
        if (!hasLicense) score -= 10
        else indicators.push("has-license")

        /* ---------- TESTS ---------- */
        const tests = await fg(
          ["**/__tests__/**", "**/*.{test,spec}.*", "**/tests/**", "**/test/**"],
          { cwd: servicePath, deep: 3, ignore: ["**/node_modules/**"] }
        )
        const hasTests = tests.length > 0
        if (!hasTests) score -= 20
        else indicators.push("has-tests")

        /* ---------- LOCKFILE ---------- */
        const lockfiles = await fg(
          ["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "poetry.lock", "go.sum", "composer.lock"],
          { cwd: servicePath }
        )
        if (lockfiles.length === 0) score -= 10
        else indicators.push("has-lockfile")

        /* ---------- NODE SCRIPTS ---------- */
        const pkgPath = path.join(servicePath, "package.json")
        try {
          const pkg = JSON.parse(await fs.readFile(pkgPath, "utf-8"))
          if (pkg.scripts) {
            if (!pkg.scripts.test) score -= 5
            if (!pkg.scripts.start && !pkg.scripts.dev) score -= 10
          }
        } catch (e) { /* non-node or missing pkg */ }

        /* ---------- GITHUB WORKFLOWS ---------- */
        const workflows = await fg([".github/workflows/*.{yml,yaml}"], { cwd: normalizedRepoPath })
        if (workflows.length > 0) {
          score += 5 // Bonus for CI
          indicators.push("has-ci-pipeline")
        }

        score = Math.max(0, Math.min(score, 100))

        results.push({
          hasReadme,
          hasLicense,
          hasTests,
          testIndicators: hasTests ? tests.slice(0, 3) : undefined,
          indicators,
          score,
          path: servicePath,
          relativePath,
        })
      }

      return { success: true, data: results }
    } catch (error: any) {
      return { success: false, warnings: [`Health detection failed: ${error.message}`] }
    }
  },
}