import fs from "fs/promises"
import path from "path"
import fg from "fast-glob"
import { Detector, DetectorResult } from "./base"
import { RuntimeInfo } from "./types"
import { ANALYSIS_IGNORE } from "./constants"

export const RuntimeDetector: Detector<RuntimeInfo[]> = {
    name: "RuntimeDetector",

    async detect(repoPath: string): Promise<DetectorResult<RuntimeInfo[]>> {
        try {
            const results: RuntimeInfo[] = []

            // 1. Normalize repoPath for fast-glob (it expects forward slashes)
            const normalizedRepoPath = repoPath.split(path.sep).join("/");

            /* -------------------------------------------------
               1. Discover all runtime indicator files
            -------------------------------------------------- */
            const files = await fg(
                [
                    "**/package.json",
                    "**/pnpm-lock.yaml",
                    "**/yarn.lock",
                    "**/requirements.txt",
                    "**/pyproject.toml",
                    "**/Pipfile",
                    "**/runtime.txt",
                    "**/go.mod",
                    "**/pom.xml",
                    "**/build.gradle",
                    "**/.nvmrc"
                ],
                {
                    cwd: normalizedRepoPath,
                    deep: 5, // Increased depth for monorepos
                    ignore: ANALYSIS_IGNORE,
                    absolute: true
                }
            )

            if (files.length === 0) {
                return { success: false, warnings: ["No indicator files found in path"] }
            }

            /* -------------------------------------------------
               2. Group files by directory
            -------------------------------------------------- */
            const byDir = new Map<string, Set<string>>()

            for (const file of files) {
                // Use path.dirname to handle absolute OS paths
                const dir = path.dirname(file)
                const name = path.basename(file)

                if (!byDir.has(dir)) {
                    byDir.set(dir, new Set())
                }
                byDir.get(dir)!.add(name)
            }

            /* -------------------------------------------------
               3. Detect runtime per directory
            -------------------------------------------------- */
            for (const [servicePath, fileSet] of byDir.entries()) {
                let runtimeInfo: RuntimeInfo | null = null

                // --- NODE ---
                if (fileSet.has("package.json")) {
                    const pkgPath = path.join(servicePath, "package.json")
                    const pkg = JSON.parse(await fs.readFile(pkgPath, "utf-8"))

                    let packageManager = "npm"
                    if (fileSet.has("pnpm-lock.yaml")) packageManager = "pnpm"
                    else if (fileSet.has("yarn.lock")) packageManager = "yarn"

                    let version = pkg.engines?.node
                    if (!version && fileSet.has(".nvmrc")) {
                        version = (await fs.readFile(path.join(servicePath, ".nvmrc"), "utf-8")).trim()
                    }

                    runtimeInfo = {
                        runtime: "node",
                        version,
                        packageManager,
                        startCommand: pkg.scripts?.start ? `${packageManager} run start` : undefined
                    }
                }
                // --- PYTHON ---
                else if (fileSet.has("requirements.txt") || fileSet.has("pyproject.toml") || fileSet.has("Pipfile")) {
                    let version: string | undefined
                    if (fileSet.has("runtime.txt")) {
                        version = (await fs.readFile(path.join(servicePath, "runtime.txt"), "utf-8")).trim()
                    }
                    runtimeInfo = { runtime: "python", version, packageManager: "pip" }
                }
                // --- GO ---
                else if (fileSet.has("go.mod")) {
                    const goMod = await fs.readFile(path.join(servicePath, "go.mod"), "utf-8")
                    runtimeInfo = { runtime: "go", version: goMod.match(/go\s+([\d.]+)/)?.[1] }
                }
                // --- JAVA ---
                else if (fileSet.has("pom.xml") || fileSet.has("build.gradle")) {
                    runtimeInfo = { runtime: "java" }
                }

                if (runtimeInfo) {
                    results.push({
                        ...runtimeInfo,
                        path: servicePath,
                        relativePath: path.relative(repoPath, servicePath) || "."
                    })
                }
            }

            return results.length > 0
                ? { success: true, data: results }
                : { success: false, warnings: ["Supported runtimes not matched in found files"] }

        } catch (error: any) {
            return { success: false, warnings: [`Detection failed: ${error.message}`] }
        }
    }
}