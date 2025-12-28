import { Response } from "express";
import { prisma } from "../config/prisma";
import { AuthRequest } from "../middleware/auth.middleware";
import { enqueueGeneratorJob } from "../queue/generator/generator.producer";

export async function triggerGenerator(req: AuthRequest, res: Response) {
    const userId = req.userId;
    const projectId = req.params.id;

    const project = await prisma.project.findFirst({
        where: {
            id: projectId,
            userId,
        },
    });

    if (!project) {
        return res.status(404).json({ message: "Project not found" });
    }

    if (project.stage !== "INFRA_PLANNING_DONE") {
        return res.status(400).json({
            error: "Infrastructure not ready for deployment",
        });
    }

    const job = await prisma.infrastructureGenJob.create({
        data: {
            projectId: project.id 
        },
    });

    await prisma.project.update({
        where: { id: project.id },
        data: {
            stage: "INFRA_GENERATING_QUEUED",
        },
    });

    await enqueueGeneratorJob(job.id, project.id);

    return res.json({
        jobId: job.id,
        status: job.status,
    });
}

/**
 * Get latest deployment job for a project
 */
export async function getLatestInfraGen(req: AuthRequest, res: Response) {
    const userId = req.userId;
    const projectId = req.params.id;

    const project = await prisma.project.findFirst({
        where: {
            id: projectId,
            userId,
        },
    });

    if (!project) {
        return res.status(404).json({ message: "Project not found" });
    }

    const job = await prisma.infrastructureGenJob.findFirst({
        where: { projectId },
        orderBy: { createdAt: "desc" },
    });

    return res.json(job);
}
