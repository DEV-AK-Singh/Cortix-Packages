import { Worker } from "bullmq";
import { redis } from "../config/redis";
import { prisma } from "../config/prisma";
import { GENERATOR_QUEUE_NAME } from "../queue/generator/generator.queue";
import { generateInfrastructure } from "../infra-generator/generator.service";

const worker = new Worker(
    GENERATOR_QUEUE_NAME,
    async (job) => {
        const { generatorJobId, projectId } = job.data;
        console.log("Running infra generator job", { generatorJobId, projectId });

        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project) {
            throw new Error("Project not found");
        }

        const infraPlan = await prisma.infrastructurePlanResult.findUnique({
            where: { projectId },
        });

        if (!infraPlan) {
            throw new Error("Infrastructure plan not found");
        }

        try {
            const generatedInfra = await generateInfrastructure(projectId);

            await prisma.infrastructureGenJob.update({
                where: { id: generatorJobId },
                data: {
                    status: "COMPLETED",
                    outputPath: generatedInfra.outputPath,
                    endedAt: new Date(),
                },
            });

            await prisma.infrastructureGenResult.upsert({
                where: { projectId },
                update: {
                    files: generatedInfra.files,
                    compose: generatedInfra.compose
                },
                create: {
                    projectId,
                    files: generatedInfra.files,
                    compose: generatedInfra.compose
                },
            });

            await prisma.project.update({
                where: { id: projectId },
                data: {
                    stage: "INFRA_GENERATING_DONE",
                },
            });

            return { success: true };
        } catch (err: any) {
            await prisma.infrastructureGenJob.update({
                where: { id: generatorJobId },
                data: {
                    status: "FAILED",
                    error: err.message,
                    endedAt: new Date(),
                },
            });

            await prisma.project.update({
                where: { id: projectId },
                data: {
                    stage: "FAILED",
                },
            });

            throw err;
        }
    },
    {
        connection: redis,
    }
);

worker.on("ready", () => {
    console.log("Generator worker is ready");
});

worker.on("completed", (job) => {
    console.log(`Generator job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
    console.error(`Generator job ${job?.id} failed`, err);
});
