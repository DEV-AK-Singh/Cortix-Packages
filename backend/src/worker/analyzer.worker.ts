import { Worker } from "bullmq";
import { redis } from "../config/redis";
import { ANALYSIS_QUEUE_NAME } from "../queue/analysis.queue";

const worker = new Worker(
    ANALYSIS_QUEUE_NAME,
    async (job) => {
        const { analysisJobId, projectId } = job.data; 
        console.log("Running analysis job", {
            analysisJobId,
            projectId,
        }); 
        // ⛔️ Placeholder — real analysis comes next
        // For now just simulate
        await new Promise((res) => setTimeout(res, 5000)); 
        return { success: true };
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
