import { Worker } from "bullmq";
import { redis } from "../config/redis";
import { ANALYSIS_QUEUE_NAME } from "../queue/analysis.queue";
import { prisma } from "../config/prisma";
import { githubClient } from "../lib/github";
import { runAnalysis } from "../analysis/analysis.engine";

const worker = new Worker(
    ANALYSIS_QUEUE_NAME,
    async (job) => {
        const { analysisJobId, projectId } = job.data;
        console.log("Running analysis job", { analysisJobId, projectId });

        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project) {
            throw new Error("Project not found");
        }

        const repoProvider = project.repoProvider;
        const repoName = project.repoName;
        const repoOwner = project.repoOwner;
        const branch = project.defaultBranch;

        const repoUrl = (repoProvider === "GITHUB") ? `https://github.com/${repoOwner}/${repoName}.git` : "";

        // 1. Mark job as RUNNING
        await prisma.analysisJob.update({
            where: { id: analysisJobId },
            data: {
                status: "RUNNING",
                startedAt: new Date(),
            },
        });
        await prisma.project.update({
            where: { id: projectId },
            data: {
                stage: "ANALYZING",
            },
        });

        try {
            const result = await runAnalysis({
                repoUrl,
                branch,
                projectId,
            });

            // 5. Store result (RAW for now)
            await prisma.analysisJob.update({
                where: { id: analysisJobId },
                data: {
                    status: "COMPLETED",
                    result: result,
                    endedAt: new Date(),
                },
            });
            await prisma.analysisResult.upsert({
                where: { projectId },
                update: {
                    type: result.type,
                    languages: result.languages,
                    frameworks: result.frameworks,
                    entry: result.entry,
                    env: result.env,
                    services: result.services,
                    docker: result.docker,
                    confidence: result.confidence,
                    version: result.version,
                },
                create: {
                    projectId,
                    type: result.type,
                    languages: result.languages,
                    frameworks: result.frameworks,
                    entry: result.entry,
                    env: result.env,
                    services: result.services,
                    docker: result.docker,
                    confidence: result.confidence,
                    version: result.version,
                },
            });
            await prisma.project.update({
                where: { id: projectId },
                data: { stage: "ANALYSIS_DONE" },
            });
            return { success: true };
        } catch (err: any) {
            // 6. Handle errors
            await prisma.analysisJob.update({
                where: { id: analysisJobId },
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
    console.log("Analysis worker is ready");
});

worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed`, err);
});
