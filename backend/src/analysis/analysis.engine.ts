import { ProjectAnalyzer } from "./detectors/analyzer";
import { CumulativeReport } from "./detectors/types";
import { execSync } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";

interface AnalysisParams {
    repoUrl: string;
    branch: string;
    projectId: string;
}

export async function runAnalysis({
    repoUrl,
    branch,
    projectId,
}: AnalysisParams): Promise<CumulativeReport | null> {
    const tempDir = path.join(os.tmpdir(), `analysis-${projectId}-${Date.now()}`);
    // Sanitize branch name for filename (remove slashes/special characters)
    const safeBranch = branch.replace(/[^a-z0-9]/gi, "-");
    const reportPath = path.join(process.cwd(), "reports", `${projectId}-${safeBranch}.json`);

    let finalReport: CumulativeReport | null = null;

    try {
        console.log(`[${projectId}] 🛠️ Cloning ${repoUrl} (branch: ${branch})...`);

        // 1. Clone
        execSync(
            `git clone --branch ${branch} --depth 1 ${repoUrl} ${tempDir}`,
            { stdio: "ignore" }
        );

        // 2. Analyze
        const report = await ProjectAnalyzer.analyze(tempDir);

        // 3. Construct Final Object
        finalReport = {
            ...report,
            projectId,
            repository: {
                ...report.repository,
                url: repoUrl,
                branch
            }
        };

        // 4. Save Report to Local Directory
        await fs.mkdir(path.dirname(reportPath), { recursive: true });
        await fs.writeFile(reportPath, JSON.stringify(finalReport, null, 2));
        console.log(`[${projectId}] ✅ Report saved to ${reportPath}`);

        return finalReport;

    } catch (error: any) {
        console.error(`[${projectId}] ❌ Analysis failed:`, error.message);
        return null;
    } finally {
        // 5. Cleanup temporary files
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
            console.log(`[${projectId}] 🧹 Cleaned up temporary files.`);
        } catch (cleanupError) {
            console.error(`[${projectId}] Cleanup failed`, cleanupError);
        }
    }
}