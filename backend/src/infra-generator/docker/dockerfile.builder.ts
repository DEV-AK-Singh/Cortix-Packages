export function buildDockerfile(service: any): string {
    const runtime = (service.runtime || "node").toLowerCase();
    const framework = (service.framework || "").toLowerCase();

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

    return `
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN ${buildCommand}

# Stage 2: Production Server
FROM nginx:stable-alpine
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
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE ${service.run.port}
CMD ${JSON.stringify(["sh", "-c", service.run.command])}
`.trim();
}

function buildPythonDockerfile(service: any) {
    return `
FROM python:3.11-slim
WORKDIR /app
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
COPY go.mod go.sum* ./
RUN go mod download
COPY . .
RUN go build -o main .

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/main .
EXPOSE ${service.run.port}
CMD ["./main"]
`.trim();
}