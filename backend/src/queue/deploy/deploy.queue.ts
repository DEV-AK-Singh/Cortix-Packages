import { Queue } from "bullmq";
import { redis } from "../../config/redis";

export const DEPLOY_QUEUE_NAME = "deploy-queue";

export const deployQueue = new Queue(DEPLOY_QUEUE_NAME, {
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
