import { Queue } from "bullmq";
import { redis } from "../../config/redis";

export const GENERATOR_QUEUE_NAME = "generator-queue";

export const generatorQueue = new Queue(GENERATOR_QUEUE_NAME, {
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
