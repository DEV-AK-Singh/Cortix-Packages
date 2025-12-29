import { Worker } from "bullmq";
import { redis } from "../config/redis"; 
import { prisma } from "../config/prisma";  
import { PLANNER_QUEUE_NAME } from "../queue/planner/planner.queue";
import { planInfrastructure } from "../infra-planner/planner.service";

const worker = new Worker(
    PLANNER_QUEUE_NAME,
    async (job) => {
        const { plannerJobId, projectId } = job.data;
        console.log("Running planner job", { plannerJobId, projectId });

        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project) {
            throw new Error("Project not found");
        }

        try {
            const infrastructurePlan = await planInfrastructure(projectId);  

            await prisma.infrastructurePlanJob.update({
                where: { id: plannerJobId },
                data: {
                    status: "COMPLETED", 
                    result: JSON.parse(JSON.stringify(infrastructurePlan)) as any,
                    endedAt: new Date(),
                },
            });
            await prisma.infrastructurePlanResult.upsert({
                where: { projectId },
                update: {
                    deploymentStrategy: infrastructurePlan?.deploymentStrategy,
                    services: infrastructurePlan?.services || [],
                    network: infrastructurePlan?.network || [],
                },
                create: {
                    projectId,
                    deploymentStrategy: infrastructurePlan?.deploymentStrategy,
                    services: infrastructurePlan?.services || [],
                    network: infrastructurePlan?.network || [],
                },
            });
            await prisma.project.update({
                where: { id: projectId },
                data: { stage: "INFRA_PLANNING_DONE" },
            });
            return { success: true };
        } catch (err: any) {
            // 6. Handle errors
            await prisma.infrastructurePlanJob.update({
                where: { id: plannerJobId },
                data: {
                    status: "FAILED",
                    error: err.message,
                    endedAt: new Date(),
                },
            });
            await prisma.project.update({
                where: { id: projectId },
                data: { stage: "FAILED" },
            });
            throw err;
        }
    },
    {
        connection: redis,
    }
);

worker.on("ready", () => {
    console.log("Planner worker is ready");
});

worker.on("completed", (job) => {
    console.log(`Planner Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
    console.error(`Planner Job ${job?.id} failed`, err);
});
