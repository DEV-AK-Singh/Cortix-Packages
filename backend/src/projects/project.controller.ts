import { Request, Response } from "express";
import { createGithubProject, getReposBranches } from "./project.service";
import { prisma } from "../config/prisma";
import { AuthRequest } from "../middleware/auth.middleware";

export async function createProject(req: AuthRequest, res: Response) {
    const { repoOwner, repoName, repoBranch } = req.body; 
    if (!repoOwner || !repoName) {
        return res.status(400).json({ message: "repoOwner & repoName required" });
    }
    const githubAccessToken = await prisma.account.findFirst({
        where: {
            userId: req.userId,
            provider: "GITHUB",
        },
    }).then(acc => acc?.accessToken);
    if (!githubAccessToken) {
        return res.status(400).json({ message: "github Access Token required" });
    }
    const project = await createGithubProject({
        userId: req.userId!,
        accessToken: githubAccessToken,
        repoOwner,
        repoName,
        repoBranch,
    });
    res.json(project);
}

export async function getBranches(req: AuthRequest, res: Response) {
    const { repoOwner, repoName } = req.params;
    if (!repoOwner || !repoName) {
        return res.status(400).json({ message: "repoOwner & repoName required" });
    }
    const githubAccessToken = await prisma.account.findFirst({
        where: {
            userId: req.userId,
            provider: "GITHUB",
        },
    }).then(acc => acc?.accessToken);
    if (!githubAccessToken) {
        return res.status(400).json({ message: "github Access Token required" });
    }
    const branches = await getReposBranches( 
        githubAccessToken,
        repoOwner,
        repoName,
    );
    res.json(branches);
}