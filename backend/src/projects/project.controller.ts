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

export async function getProjects(req: AuthRequest, res: Response) {
    const projects = await prisma.project.findMany({
        where: {
            userId: req.userId,
        },
    });
    res.json(projects);
}

export async function getProjectById(req: AuthRequest, res: Response) {
    console.log("getProjectById called with params:", req.params);
    const { repoId: projectId, repoBranch } = req.params;
    const project = await prisma.project.findFirst({
        where: {
            id: projectId,
            defaultBranch: repoBranch
        },
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