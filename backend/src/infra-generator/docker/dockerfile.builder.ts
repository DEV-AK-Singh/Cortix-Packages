interface EnvVarData {
    name: string;
    value: string;
}

function buildEnvArray(
    envVars: string[],
    envValues: Record<string, string>
): EnvVarData[] {
    return envVars.map((varName) => ({
        name: varName,
        value: envValues[varName] || ""
    }));
}

export function buildDockerfile(service: any): string {
    const runtime = (service.runtime || "node").toLowerCase();
    const framework = (service.framework || "").toLowerCase();
    const envVars = service?.run?.envVars || [];
    const envValues = service?.envValues || {};
    const envArray = buildEnvArray(envVars, envValues);
    const envSection = envArray.length > 0
        ? envArray.map(env => `ENV ${env.name}=${env.value}`).join('\n')
        : "";

    service.envSection = envSection;

    // Handle Static Frontends (React, Vite, Vue, Angular)
    const staticFrameworks = ["react", "vite", "vue", "angular", "svelte"];
    if (staticFrameworks.includes(framework) || service.type === "frontend") {
        return buildStaticFrontendDockerfile(service);
    }

    // Handle Runtimes
    switch (runtime) {
        case "node":
        case "nodejs":
            return buildNodeDockerfile(service);
        case "python":
            return buildPythonDockerfile(service);
        case "go":
        case "golang":
            return buildGoDockerfile(service);
        default:
            throw new Error(`Unsupported runtime: ${runtime}`);
    }
}

/**
 * STRATEGY: Build assets, then serve with NGINX
 */
function buildStaticFrontendDockerfile(service: any) {
    const buildCommand = service.run.buildCommand || "npm run build";
    const distPath = service.run.distPath || "dist"; // Vite defaults to dist, CRA to build

    const currentService = service?.analysisReportResult?.services?.find((s: any) => s.name === service.name);
    const hasNginx = currentService?.health?.indicators?.includes("has-nginx-config");
    const nginxConfig = hasNginx
        ? `COPY ${service.path}/nginx.conf /etc/nginx/nginx.conf`
        : "";

    return `
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
# Inject Environment Variables if they exist
${service.envSection}
COPY ${service.path}/package*.json ./
RUN npm install
COPY ${service.path} .
RUN ${buildCommand}

# Stage 2: Production Server
FROM nginx:stable-alpine
${nginxConfig}
# Copy built assets to nginx default serve directory
COPY --from=builder /app/${distPath} /usr/share/nginx/html
# Standard Nginx port
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`.trim();
}

function buildNodeDockerfile(service: any) {
    return `
FROM node:20-alpine
WORKDIR /app
# Inject Environment Variables if they exist
${service.envSection}
COPY ${service.path}/package*.json ./
RUN npm install
COPY ${service.path} .
EXPOSE ${service.run.port}
CMD ${JSON.stringify(["sh", "-c", service.run.command])}
`.trim();
}

function buildPythonDockerfile(service: any) {
    return `
FROM python:3.11-slim
WORKDIR /app
# Inject Environment Variables if they exist
${service.envSection}
# Prevents Python from writing .pyc files and enables unbuffered logging
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE ${service.run.port}
CMD ${JSON.stringify(["sh", "-c", service.run.command || "python main.py"])}
`.trim();
}

function buildGoDockerfile(service: any) {
    return `
FROM golang:1.22-alpine AS builder
WORKDIR /app
# Inject Environment Variables if they exist
${service.envSection}
COPY go.mod go.sum* ./
RUN go mod download
COPY ${service.path} .
RUN go build -o main .

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/main .
EXPOSE ${service.run.port}
CMD ["./main"]
`.trim();
}