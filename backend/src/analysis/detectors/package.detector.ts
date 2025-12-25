import fs from "fs";

export function detectPackageManager(repoPath: string) {
    if (fs.existsSync(`${repoPath}/pnpm-lock.yaml`)) return "pnpm";
    if (fs.existsSync(`${repoPath}/yarn.lock`)) return "yarn";
    if (fs.existsSync(`${repoPath}/package-lock.json`)) return "npm";
    return null;
}
