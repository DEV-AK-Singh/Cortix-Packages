export function buildDockerCompose(plan: any): string {
    const services: Record<string, any> = {}

    for (const service of plan.services) {
        services[service.name] = {
            build: {
                context: ".",
                dockerfile: `${service.name}.Dockerfile`,
            },
            ports: service.proxy?.enabled
                ? [`${service.run.port}:${service.run.port}`]
                : [],
            environment: service.run.envVars || [],
        }
    }

    return `
version: "3.9"

services:
${Object.entries(services)
            .map(
                ([name, cfg]) => `
  ${name}:
    build:
      context: ${cfg.build.context}
      dockerfile: ${cfg.build.dockerfile}
    ports:
${cfg.ports.map((p: string) => `      - "${p}"`).join("\n")}
    environment:
${cfg.environment.map((e: string) => `      - ${e}`).join("\n")}
`
            )
            .join("\n")}
`.trim()
}
