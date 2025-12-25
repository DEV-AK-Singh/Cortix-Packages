import { Queue } from "bullmq";
import { redis } from "../config/redis";

export const ANALYSIS_QUEUE_NAME = "analysis-queue";

export const analysisQueue = new Queue(ANALYSIS_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});
