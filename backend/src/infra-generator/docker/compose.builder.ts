export function buildDockerCompose(plan: any): string {
  if (!plan || !plan.services || !Array.isArray(plan.services)) {
    throw new Error("Invalid Deployment Plan: No services found.");
  }

  const serviceEntries = plan.services.map((service: any) => {
    const name = (service.name || `service-${Math.random().toString(36).substring(7)}`)
      .replace(/\s+/g, '-')
      .toLowerCase();
    
    const port = service.run?.port || 3000;
    const path = service.path || ".";

    // 1. Process Environment Variables first to check if we need the scope
    const envList = service.run?.envVars || [];
    const validEnvs = envList
      .map((e: any) => {
        if (typeof e === 'string' && e.includes('=')) return `      - ${e}`;
        if (e && e.name) {
          return `      - ${e.name}=${e.value ?? ""}`;
        }
        return null;
      })
      .filter(Boolean);

    // 2. Build the environment string only if envs exist
    const environmentBlock = validEnvs.length > 0 
      ? `    environment:\n${validEnvs.join("\n")}` 
      : "";

    // 3. Construct the service block, filtering out the empty environment string
    return `
  ${name}:
    build:
      context: .
      dockerfile: ./${path}/Dockerfile.cortix
    ports:
      - "${port}:${port}"${environmentBlock ? `\n${environmentBlock}` : ""}
    restart: always`;
  }).join("\n");

  return `version: "3.9"

services:
${serviceEntries}

networks:
  default:
    name: cortix-network
`.trim();
}