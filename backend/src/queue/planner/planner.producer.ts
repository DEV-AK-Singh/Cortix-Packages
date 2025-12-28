import { plannerQueue } from "./planner.queue";

export async function enqueuePlannerJob(
  plannerJobId: string,
  projectId: string
) {
  await plannerQueue.add("planner-project", {
    plannerJobId,
    projectId,
  });
}
