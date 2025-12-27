import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { enqueueAnalysisJob } from "../queue/analysis.producer";
import { AuthRequest } from "../middleware/auth.middleware";

export async function triggerAnalysis(req: AuthRequest, res: Response) {
    const userId = req.userId;
    const projectId = req.params.id;
    const project = await prisma.project.findFirst({
        where: {
            id: projectId,
            userId: userId,
        },
    });
    if (!project) {
        return res.status(404).json({ message: "Project not found" });
    }
    if (project.stage !== "CREATED") {
        return res
            .status(400)
            .json({ error: "Analysis already triggered" });
    }
    const job = await prisma.analysisJob.create({
        data: {
            projectId: project.id,
        },
    });
    await prisma.project.update({
        where: { id: project.id },
        data: {
            stage: "ANALYSIS_QUEUED",
        },
    });
    await enqueueAnalysisJob(job.id, project.id);
    res.json({
        jobId: job.id,
        status: job.status,
    });
}

export async function getLatestAnalysis(req: AuthRequest, res: Response) {
    const userId = req.userId;
    const projectId = req.params.id;
    const project = await prisma.project.findFirst({
        where: {
            id: projectId,
            userId: userId,
        },
    });
    if (!project) {
        return res.status(404).json({ message: "Project not found" });
    }
    const job = await prisma.analysisJob.findFirst({
        where: { projectId },
        orderBy: { createdAt: "desc" },
    });
    res.json(job);
} 