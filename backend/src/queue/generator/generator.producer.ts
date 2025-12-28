import { generatorQueue } from "./generator.queue";

export async function enqueueGeneratorJob(
  generatorJobId: string,
  projectId: string
) {
  await generatorQueue.add("generator-project", {
    generatorJobId,
    projectId,
  });
}
