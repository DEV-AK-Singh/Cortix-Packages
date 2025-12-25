export function detectFrameworks(pkg: any | null): string[] {
  if (!pkg) return [];

  const deps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  const frameworks: string[] = [];

  if (deps.next) frameworks.push("nextjs");
  if (deps.react && deps.vite) frameworks.push("react");
  if (deps.express) frameworks.push("express");
  if (deps["@nestjs/core"]) frameworks.push("nestjs");
  if (deps.django) frameworks.push("django");
  if (deps.flask) frameworks.push("flask");
  if (deps.fastapi) frameworks.push("fastapi");

  return frameworks;
}
