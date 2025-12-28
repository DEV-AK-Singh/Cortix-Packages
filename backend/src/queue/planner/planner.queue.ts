import { Queue } from "bullmq";
import { redis } from "../../config/redis";

export const PLANNER_QUEUE_NAME = "planner-queue";

export const plannerQueue = new Queue(PLANNER_QUEUE_NAME, {
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
