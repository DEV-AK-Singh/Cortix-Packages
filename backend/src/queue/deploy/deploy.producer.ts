import { deployQueue } from "./deploy.queue";

export async function enqueueDeployJob(
  deployJobId: string,
  projectId: string
) {
  await deployQueue.add("deploy-project", {
    deployJobId,
    projectId,
  });
}
