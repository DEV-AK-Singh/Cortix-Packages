export function buildDockerfile(service: any): string {
    const runtime = service.runtime || "node"

    if (runtime === "node") {
        return buildNodeDockerfile(service)
    }

    if (runtime === "python") {
        return buildPythonDockerfile(service)
    }

    if (runtime === "go") {
        return buildGoDockerfile(service)
    }

    throw new Error(`Unsupported runtime: ${runtime}`)
}

function buildNodeDockerfile(service: any) {
    return `
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE ${service.run.port}

CMD ["sh", "-c", "${service.run.command}"]
`.trim()
}

function buildPythonDockerfile(service: any) {
    return `
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE ${service.run.port}

CMD ["sh", "-c", "${service.run.command || "python app.py"}"]
`.trim()
}

function buildGoDockerfile(service: any) {
    return `
FROM golang:1.22-alpine

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o app

EXPOSE ${service.run.port}

CMD ["./app"]
`.trim()
}
