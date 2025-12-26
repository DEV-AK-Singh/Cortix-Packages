import fg from "fast-glob"
import path from "path"
import fs from "fs/promises"
import { Detector, DetectorResult } from "./base"
import { ToolingInfo } from "./types"

export const ToolingDetector: Detector<ToolingInfo[]> = {
  name: "ToolingDetector",

  async detect(repoPath: string): Promise<DetectorResult<ToolingInfo[]>> {
    try {
      const results: ToolingInfo[] = []
      const normalizedRepoPath = repoPath.split(path.sep).join("/")

      /* ---------------------------------------------
         1. Detect service roots
      ---------------------------------------------- */
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

      /* ---------------------------------------------
         2. Scan tooling per service
      ---------------------------------------------- */
      for (const servicePath of uniqueRoots) {
        const indicators: string[] = []
        const testFrameworks = new Set<string>()
        const relativePath = path.relative(repoPath, servicePath) || "."

        let linter: string | undefined
        let formatter: string | undefined
        let compiler: string | undefined

        // Detect via Files
        const files = await fg(
          [
            "**/.eslintrc*", "**/eslint.config.*", "**/tslint.json",
            "**/.prettierrc*", "**/prettier.config.*",
            "**/tsconfig.json", "**/babel.config.*", "**/webpack.config.*",
            "**/vite.config.*", "**/next.config.*",
            "**/jest.config.*", "**/vitest.config.*", "**/pytest.ini",
            "**/*_test.go"
          ],
          {
            cwd: servicePath.split(path.sep).join("/"),
            deep: 3,
            absolute: false,
            ignore: ["**/node_modules/**", "**/dist/**"],
          }
        )

        // Process File Indicators
        for (const file of files) {
          const name = path.basename(file)
          indicators.push(name)

          if (name.includes("eslint")) linter = "ESLint"
          if (name === "tslint.json") linter = "TSLint"
          if (name.includes("prettier")) formatter = "Prettier"
          if (name === "tsconfig.json") compiler = "TypeScript"
          if (name.includes("vite")) compiler = "Vite"
          if (name.includes("jest")) testFrameworks.add("Jest")
          if (name.includes("vitest")) testFrameworks.add("Vitest")
          if (name === "pytest.ini") testFrameworks.add("PyTest")
          if (name.endsWith("_test.go")) testFrameworks.add("Go Test")
        }

        // Deep Scan: Check package.json dependencies for hidden tooling
        const pkgPath = path.join(servicePath, "package.json")
        try {
          const pkg = JSON.parse(await fs.readFile(pkgPath, "utf-8"))
          const allDeps = { ...pkg.dependencies, ...pkg.devDependencies }

          if (allDeps.eslint && !linter) linter = "ESLint"
          if (allDeps.prettier && !formatter) formatter = "Prettier"
          if (allDeps.jest) testFrameworks.add("Jest")
          if (allDeps.cypress) testFrameworks.add("Cypress")
          if (allDeps.playwright) testFrameworks.add("Playwright")
          if (allDeps.typescript && !compiler) compiler = "TypeScript"
        } catch (e) { /* Not a Node service or unreadable */ }

        if (indicators.length > 0 || testFrameworks.size > 0 || linter || formatter) {
          results.push({
            linter,
            formatter,
            compiler,
            testFrameworks: [...testFrameworks],
            indicators: [...new Set(indicators)],
            path: servicePath,
            relativePath,
          })
        }
      }

      return results.length > 0
        ? { success: true, data: results }
        : { success: false, warnings: ["No tooling detected"] }

    } catch (error: any) {
      return { success: false, warnings: [`Tooling detection failed: ${error.message}`] }
    }
  },
}