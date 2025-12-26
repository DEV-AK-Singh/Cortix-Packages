import fg from "fast-glob"
import path from "path"
import { Detector, DetectorResult } from "./base"
import { ANALYSIS_IGNORE } from "./constants"
import { RepoMetadata } from "./types"

export const RepoMetadataDetector: Detector<RepoMetadata> = {
    name: "RepoMetadataDetector",

    async detect(repoPath: string): Promise<DetectorResult<RepoMetadata>> {
        try {
            const repoName = path.basename(repoPath)
            const scanTimestamp = new Date().toUTCString()

            const files = await fg("**/*", {
                cwd: repoPath,
                onlyFiles: true,
                ignore: ANALYSIS_IGNORE
            })

            const dirs = await fg("*", {
                cwd: repoPath,
                onlyDirectories: true,
                deep: 1,
                ignore: ANALYSIS_IGNORE
            })

            return {
                success: true,
                data: {
                    repoName,
                    scanTimestamp,
                    totalFiles: files.length,
                    directories: dirs
                }
            }
        } catch (error: any) {
            return {
                success: false,
                warnings: [`Repo metadata detection failed: ${error.message}`]
            }
        }
    }
}
