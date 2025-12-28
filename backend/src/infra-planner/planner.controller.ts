import { Response } from "express";
import { prisma } from "../config/prisma"; 
import { AuthRequest } from "../middleware/auth.middleware";
import { enqueuePlannerJob } from "../queue/planner/planner.producer";

export async function triggerPlanner(req: AuthRequest, res: Response) {
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
    if (project.stage !== "ANALYSIS_DONE") {
        return res
            .status(400)
            .json({ error: "Infrastructure planning already triggered!!" });
    }
    const job = await prisma.infrastructurePlanJob.create({
        data: {
            projectId: project.id,
        },
    });
    await prisma.project.update({
        where: { id: project.id },
        data: {
            stage: "INFRA_PLANNING_QUEUED",
        },
    });
    await enqueuePlannerJob(job.id, project.id);
    res.json({
        jobId: job.id,
        status: job.status,
    });
}

export async function getLatestInfraPlan(req: AuthRequest, res: Response) {
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
    const job = await prisma.infrastructurePlanJob.findFirst({
        where: { projectId },
        orderBy: { createdAt: "desc" },
    });
    res.json(job);
} 