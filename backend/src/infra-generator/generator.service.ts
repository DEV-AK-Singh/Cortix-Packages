import fs from "fs/promises"
import path from "path"
import { prisma } from "../config/prisma"
import { buildDockerfile } from "./docker/dockerfile.builder"
import { buildDockerCompose } from "./docker/compose.builder"
import dotenv from "dotenv";
dotenv.config();

export async function generateInfrastructure(projectId: string) {
    const plan = await prisma.infrastructurePlanResult.findUnique({
        where: { projectId },
    })

    const project = await prisma.project.findUnique({
        where: { id: projectId },
    })

    
    if (!project || !plan) {
        throw new Error("No infrastructure plan found")
    }

    console.log("Env Vars:", project?.envVars);

    const branch = project.defaultBranch;

    const analysisReportResult = await prisma.analysisResult.findUnique({
        where: { projectId },
    })

    const outputDir = path.join(process.cwd(), "repos", `repo-${projectId}-${branch}`, "infra");

    await fs.mkdir(outputDir, { recursive: true })

    const generatedFiles: { path: string; type: string }[] = []

    // 1️⃣ Generate Dockerfiles
    for (const service of plan.services as any[]) {
        service.envValues = project.envVars || {} 
        service.analysisReportResult = analysisReportResult

        const dockerfile = buildDockerfile(service)

        const fileName =
            plan.deploymentStrategy === "DOCKER_COMPOSE"
                ? `${service.name}.Dockerfile`
                : "Dockerfile"

        const filePath = path.join(outputDir, fileName)
        console.log(`Writing Dockerfile for service ${service.name} at ${filePath}`)

        await fs.writeFile(filePath, dockerfile)
        generatedFiles.push({ path: fileName, type: "Dockerfile" })
    }

    // 2️⃣ Generate docker-compose.yml (if needed)
    let composeObject = {}

    if (plan.deploymentStrategy === "DOCKER_COMPOSE") {
        const compose = await buildDockerCompose(plan)
        const composePath = path.join(outputDir, "docker-compose.yml")

        await fs.writeFile(composePath, compose)
        composeObject = compose

        generatedFiles.push({
            path: "docker-compose.yml",
            type: "DockerCompose",
        })
    }

    return {
        outputPath: outputDir,
        files: generatedFiles,
        compose: composeObject,
    }
}

// generateInfrastructure("7716c6d0-e831-427c-ab69-f9766330404a").catch((err) => {
//     console.error("Error generating infrastructure:", err)
// });