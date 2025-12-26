import fg from "fast-glob"
import path from "path"
import { Detector, DetectorResult } from "./base"
import { ANALYSIS_IGNORE, EXTENSION_LANGUAGE_MAP } from "./constants"
import { LanguageComposition } from "./types"

export const LanguageCompositionDetector: Detector<LanguageComposition> = {
    name: "LanguageCompositionDetector",

    async detect(repoPath: string): Promise<DetectorResult<LanguageComposition>> {
        try {
            const files = await fg("**/*", {
                cwd: repoPath,
                onlyFiles: true,
                ignore: ANALYSIS_IGNORE
            })

            if (!files.length) {
                return {
                    success: false,
                    warnings: ["No files found for language detection"]
                }
            }

            const counts: Record<string, number> = {}
            let total = 0

            for (const file of files) {
                const ext = path.extname(file).toLowerCase()
                const lang = EXTENSION_LANGUAGE_MAP[ext]

                if (!lang) continue

                counts[lang] = (counts[lang] || 0) + 1
                total++
            }

            if (!total) {
                return {
                    success: false,
                    warnings: ["No recognizable language files found"]
                }
            }

            const languages = Object.entries(counts)
                .map(([name, count]) => ({
                    name,
                    percentage: Number(((count / total) * 100).toFixed(2))
                }))
                .sort((a, b) => b.percentage - a.percentage)

            return {
                success: true,
                data: {
                    primaryLanguage: languages[0].name,
                    languages
                }
            }
        } catch (error: any) {
            return {
                success: false,
                warnings: [`Language detection failed: ${error.message || error}`]
            }
        }
    }
}
