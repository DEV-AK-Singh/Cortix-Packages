import { analysisQueue } from "./analysis.queue";

export async function enqueueAnalysisJob(
  analysisJobId: string,
  projectId: string
) {
  await analysisQueue.add("analyze-project", {
    analysisJobId,
    projectId,
  });
}
