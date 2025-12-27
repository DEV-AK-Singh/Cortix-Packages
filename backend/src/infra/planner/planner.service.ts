import { prisma } from "../../config/prisma";

export class InfraPlannerService {
  async createDeploymentPlan(projectId: string) {
    // 1. Fetch the latest AnalysisResult
    const analysis = await prisma.analysisResult.findUnique({
      where: { projectId },
    });

    await prisma.project.update({
      where: { id: projectId },
      data: { stage: "INFRA_PLANNING" },
    });

    if (!analysis) throw new Error("No analysis result found for this project");

    // 2. The Decision Engine Logic
    const services = (analysis.services as any[]) || [];
    const isMonorepo = services.length > 1;

    const servicePlans = services.map((service: any) => {
      const isServer = service.name.toLowerCase().includes("server") || service.apiStyles?.length > 0;

      return {
        name: service.name,
        path: service.relativePath,
        runtime: service.runtime?.runtime || "node",
        framework: service.frameworks?.[0]?.name,
        build: {
          strategy: "DOCKERFILE",
          source: "GENERATED", // In V1 we generate, even if one exists, for consistency
        },
        run: {
          command: service.entryPoints?.[0]?.command || service.runtime?.startCommand || "npm start",
          port: this.detectPort(service),
          envVars: service.envVars?.used?.map((e: any) => e.name) || [],
        },
        proxy: {
          enabled: true,
          publicPath: isMonorepo && isServer ? "/api" : "/",
        },
      };
    });

    const deploymentStrategy = isMonorepo ? "DOCKER_COMPOSE" : "DOCKER_SINGLE";

    // 3. Sync to Database (Atomic Transaction)
    return await prisma.$transaction([
      prisma.infrastructurePlan.upsert({
        where: { projectId },
        update: {
          deploymentStrategy,
          services: servicePlans,
          network: { internalDomain: `${projectId}.local`, exposedPorts: [80] },
        },
        create: {
          projectId,
          deploymentStrategy,
          services: servicePlans,
          network: { internalDomain: `${projectId}.local`, exposedPorts: [80] },
        },
      }),
      prisma.project.update({
        where: { id: projectId },
        data: { stage: "INFRA_PLANNED" },
      }),
    ]);
  }

  private detectPort(service: any): number {
    const framework = service.frameworks?.[0]?.name?.toLowerCase();
    if (framework === "next.js") return 3000;
    if (framework === "react" || framework === "vite") return 5173;
    if (framework === "express") return 5000;
    return 3000;
  }
}