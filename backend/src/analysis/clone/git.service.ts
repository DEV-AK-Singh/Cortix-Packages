import { exec } from "child_process";
import path from "path";
import fs from "fs/promises";
import util from "util";

const execAsync = util.promisify(exec);

export async function cloneRepo(
    repoUrl: string,
    branch: string,
    projectId: string
) {
    const baseDir = path.join(process.cwd(), "tmp");
    const repoDir = path.join(baseDir, projectId);

    await fs.rm(repoDir, { recursive: true, force: true });
    await fs.mkdir(baseDir, { recursive: true });

    await execAsync(
        `git clone --depth=1 --branch ${branch} ${repoUrl} ${repoDir}`
    );

    return repoDir;
}
