import fs from "fs";

export function detectDocker(repoPath: string) {
    if (fs.existsSync(`${repoPath}/Dockerfile`)) return true;
    return false;
}
