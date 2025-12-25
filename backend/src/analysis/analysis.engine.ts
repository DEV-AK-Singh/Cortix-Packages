import { cloneRepo } from "./clone/git.service";
import { detectPackageManager } from "./detectors/package.detector";
import { detectLanguages } from "./detectors/languages.detector";
import { detectFrameworks } from "./detectors/framework.detector";
import { detectEntry } from "./detectors/entry.detector";
import { detectEnv } from "./detectors/env.detector";
import { detectServices } from "./detectors/service.detector";
import { calculateConfidence } from "./confidence/confidence";
import { safeReadJSON } from "../utils/fs-safe";

export async function runAnalysis({
    repoUrl,
    branch,
    projectId,
}: {
    repoUrl: string;
    branch: string;
    projectId: string;
}) {
    const repo = await cloneRepo(repoUrl, branch, projectId);

    const warnings: string[] = [];

    const pkg = safeReadJSON(`${repo}/package.json`);
    if (!pkg) warnings.push("package.json missing");

    const languages = detectLanguages(repo);
    const frameworks = detectFrameworks(pkg);
    const pm = detectPackageManager(repo);

    const entry = detectEntry({
        pkg,
        pm,
        frameworks,
        languages,
    });

    const env = detectEnv(repo);
    const services = detectServices(env);

    const confidence = calculateConfidence({
        languages,
        frameworks,
        entry,
    });

    return {
        type: frameworks.includes("nextjs") ? "fullstack" : "backend",
        languages,
        frameworks,
        entry,
        env,
        services,
        docker: { supported: false, strategy: "generated" },
        confidence,
        warnings,
        version: "v1",
    };
}
