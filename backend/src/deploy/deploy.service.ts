import { prisma } from "../config/prisma";
import { exec } from "child_process";
import net from "net";
import path from "path";

function getAvailablePort(port: number): Promise<number> {
    return new Promise((resolve, reject) => {
        const server = net.createServer();

        server.once("error", (err: any) => {
            if (err.code === "EADDRINUSE") {
                // Port is busy, try the next one
                resolve(getAvailablePort(port + 1));
            } else {
                reject(err);
            }
        });

        server.once("listening", () => {
            // Port is free! Close the test server and return the port.
            server.close(() => resolve(port));
        });

        server.listen(port);
    });
}

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

export async function deploySingleService(repoPath: string, service: any, dockerfile: string, servicePath: string = ".") {
    const randomId = Math.random().toString(36).substring(7);
    const imageName = `cortix-${service.name}-${randomId}`;
    const containerName = `${imageName}-container`;
    const dockerfilePath = `infra/${dockerfile}`;

    await execPromise(
        `docker build -t ${imageName} -f ${dockerfilePath} ${servicePath}`,
        repoPath
    );

    const containerPort = service.run.port || 3000;
    const hostPort = await getAvailablePort(containerPort + 1);
    console.log(`Mapping Host Port ${hostPort} -> Container Port ${containerPort}`);

    await execPromise(
        `docker run -d -p ${hostPort}:${containerPort} --name ${containerName} ${imageName}`,
        repoPath
    );

    const publicUrl = `http://localhost:${hostPort}`;

    return {
        services: [
            {
                name: service.name,
                image: imageName,
                container: containerName,
                port: service.run.port,
                url: publicUrl
            },
        ],
    };
}

export async function deployCompose(repoPath: string) {
    const randomId = Math.random().toString(36).substring(7);
    const composeFilePath = path.join(repoPath, "infra", "docker-compose.yml");
    await execPromise(`docker compose -f ${composeFilePath} -p compose-${randomId} up -d --build`, repoPath);
    const composeName = `compose-${randomId}`;
    return {
        services: [
            {
                name: composeName,
                status: "running",
            },
        ],
    };
}

function execPromise(cmd: string, cwd: string) {
    return new Promise((resolve, reject) => {
        exec(cmd, { cwd }, (err, stdout, stderr) => {
            if (err) return reject(stderr || err.message);
            resolve(stdout);
        });
    });
}

// deployCompose(path.join(process.cwd(), "repos", "repo-7716c6d0-e831-427c-ab69-f9766330404a-master")).then(result => {
//     console.log("Deployment Result:", result);
// }).catch(err => {
//     console.error("Deployment Error:", err);
// });