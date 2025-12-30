import net from "net";

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

export async function buildDockerCompose(plan: any): Promise<string> {
  if (!plan || !plan.services || !Array.isArray(plan.services)) {
    throw new Error("Invalid Deployment Plan: No services found.");
  }

  // 1. Map to an array of Promises
  const servicePromises = plan.services.map(async (service: any, index: number) => {
    const name = (service.name || `service-${Math.random().toString(36).substring(7)}`)
      .replace(/\s+/g, '-')
      .toLowerCase();

    // 2. Find an available port. 
    // We add 'index' to the starting port (3000) to reduce collision 
    // attempts when multiple services start checking at once.
    const hostPort = await getAvailablePort(3000 + index); 
    const containerPort = service.run?.port || 80;

    return `
  ${name}:
    build:
      context: ..
      dockerfile: infra/${service.name}.Dockerfile
    ports:
      - "${hostPort}:${containerPort}"
    restart: always`;
  });

  // 3. Wait for all ports to be found and strings to be generated
  const resolvedServiceEntries = await Promise.all(servicePromises);

  return `version: "3.9"

services:
${resolvedServiceEntries.join("")}

networks:
  default:
    name: cortix-network
`.trim();
}