import { prisma } from "../config/prisma";
import dotenv from "dotenv";
dotenv.config();

export async function planInfrastructure(projectId: string) {
    const analysis = await prisma.analysisResult.findUnique({
        where: { projectId },
    });

    if (!analysis) throw new Error("No analysis result found for this project");

    // 2. The Decision Engine Logic
    const services = (analysis.services as any[]) || [];
    const isMonorepo = services.length > 1;

    const servicePlans = services.map((service: any) => {
        const isServer = service.name.toLowerCase().includes("server") || service.apiStyles?.length > 0;

        return {
            name: service.name,
            path: service.path || ".",
            runtime: service.runtime?.runtime || "node",
            framework: service.frameworks?.[0]?.name,
            build: {
                strategy: "DOCKERFILE",
                source: "GENERATED", // In V1 we generate, even if one exists, for consistency
            },
            run: {
                command: service.entryPoints?.[0]?.command || service.runtime?.startCommand || "npm start",
                port: detectPort(service),
                envVars: service.envVars?.used?.map((e: any) => e.name) || [],
            },
            proxy: {
                enabled: true,
                publicPath: isMonorepo && isServer ? "/api" : "/",
            },
        };
    });

    const deploymentStrategy = isMonorepo ? "DOCKER_COMPOSE" : "DOCKER_SINGLE";

    const finalInfrastructurePlan = { projectId, deploymentStrategy, services: servicePlans, network: { internalDomain: `${projectId}.local`, exposedPorts: [80] } }; 

    return finalInfrastructurePlan;
}

function detectPort(service: any): number {
    const framework = service.frameworks?.[0]?.name?.toLowerCase();
    if (framework === "next.js") return 3000;
    if (framework === "react" || framework === "vite" || framework === "vue" || framework === "svelte" || framework === "angular" || framework === "sveltekit") return 80;
    if (framework === "express") return 5000;
    return 3000;
} 

// planInfrastructure("7716c6d0-e831-427c-ab69-f9766330404a").catch((err) => {
//     console.error("Error planning infrastructure:", err);
// });