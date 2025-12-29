import { prisma } from "../config/prisma";

export async function prepareDeployment(projectId: string) {
    const infraGen = await prisma.infrastructurePlanResult.findUnique({
        where: { projectId },
    });

    if (!infraGen) {
        throw new Error("Infrastructure not generated");
    }

    return {
        projectId,
        strategy: infraGen.deploymentStrategy,
        services: infraGen.services,
    };
}
