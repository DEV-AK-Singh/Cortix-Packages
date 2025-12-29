import { Response } from "express";
import { prisma } from "../config/prisma";
import { AuthRequest } from "../middleware/auth.middleware";
import { enqueueDeployJob } from "../queue/deploy/deploy.producer";

export async function triggerDeploy(req: AuthRequest, res: Response) {
    const userId = req.userId;
    const projectId = req.params.id;

    const project = await prisma.project.findFirst({
        where: { id: projectId, userId },
    });

    if (!project) {
        return res.status(404).json({ message: "Project not found" });
    }

    if (project.stage !== "INFRA_GENERATING_DONE") {
        return res.status(400).json({
            error: "Infrastructure not ready for deployment",
        });
    }

    const job = await prisma.deploymentJob.create({
        data: { projectId },
    });

    await prisma.project.update({
        where: { id: projectId },
        data: { stage: "DEPLOYING_QUEUED" },
    });

    await enqueueDeployJob(job.id, projectId);

    res.json({ jobId: job.id, status: job.status });
}

export async function getLatestDeployment(req: AuthRequest, res: Response) {
    const projectId = req.params.id;

    const job = await prisma.deploymentJob.findFirst({
        where: { projectId },
        orderBy: { createdAt: "desc" },
    });

    res.json(job);
}
