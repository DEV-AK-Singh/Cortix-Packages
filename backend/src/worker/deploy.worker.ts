import { Worker } from "bullmq";
import { redis } from "../config/redis";
import { prisma } from "../config/prisma";
import { DEPLOY_QUEUE_NAME } from "../queue/deploy/deploy.queue";
import path from "path";
import { deployCompose, deploySingleService } from "../deploy/deploy.service";

const worker = new Worker(
  DEPLOY_QUEUE_NAME,
  async (job) => {
    const { deployJobId, projectId } = job.data;

    await prisma.deploymentJob.update({
      where: { id: deployJobId },
      data: { status: "RUNNING", startedAt: new Date() },
    });

    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });
      if (!project) throw new Error("Project not found");

      const infraPlan = await prisma.infrastructurePlanResult.findUnique({
        where: { projectId },
      });
      if (!infraPlan) throw new Error("Infrastructure plan missing");

      const infraGen = await prisma.infrastructureGenResult.findUnique({
        where: { projectId },
      });
      if (!infraGen) throw new Error("Infrastructure not generated");

      const repoPath = path.join(process.cwd(), "repos", `repo-${projectId}-${project.defaultBranch}`);

      let deploymentResult: any;

      switch (infraPlan.deploymentStrategy) {
        case "DOCKER_SINGLE":
          if (!infraPlan.services || !Array.isArray(infraPlan.services)) {
            throw new Error("Services configuration is missing or invalid");
          }
          if (!infraGen.files || !Array.isArray(infraGen.files)) {
            throw new Error("Files configuration is missing or invalid");
          }
          const dockerfile = infraGen.files[0] as { path: string };
          const service = infraPlan.services[0] as { name: string };

          deploymentResult = await deploySingleService(
            repoPath,
            infraPlan.services[0],
            dockerfile.path,
            service.name === "root" ? "." : service.name
          );
          break;

        case "DOCKER_COMPOSE":
          deploymentResult = await deployCompose(repoPath);
          break;

        default:
          throw new Error(
            `Unsupported deployment strategy: ${infraPlan.deploymentStrategy}`
          );
      }

      await prisma.deploymentJob.update({
        where: { id: deployJobId },
        data: {
          status: "COMPLETED",
          result: deploymentResult,
          endedAt: new Date(),
        },
      });

      await prisma.deploymentResult.upsert({
        where: { projectId },
        update: {
          provider: "LOCAL_DOCKER",
          services: deploymentResult.services,
          logs: deploymentResult.logs,
        },
        create: {
          projectId,
          provider: "LOCAL_DOCKER",
          services: deploymentResult.services,
          logs: deploymentResult.logs,
        },
      });

      await prisma.project.update({
        where: { id: projectId },
        data: { stage: "DEPLOYING_DONE" },
      });

      return { success: true };
    } catch (err: any) {
      await prisma.deploymentJob.update({
        where: { id: deployJobId },
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
  { connection: redis }
);

worker.on("ready", () => {
  console.log("Deploy worker is ready");
});

worker.on("completed", (job) => {
  console.log(`Deploy Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Deploy Job ${job?.id} failed`, err);
});
