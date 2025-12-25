export function detectEntry({
  pkg,
  pm,
  frameworks,
  languages,
}: {
  pkg: any | null;
  pm: string | null;
  frameworks: string[];
  languages: string[];
}) {
  // Node
  if (pkg && pm) {
    return {
      build: pkg.scripts?.build
        ? `${pm} ${pm === "npm" ? "run build" : "build"}`
        : null,
      start: pkg.scripts?.start
        ? `${pm} ${pm === "npm" ? "run start" : "start"}`
        : null,
    };
  }

  // Python
  if (languages.includes("python")) {
    if (frameworks.includes("django")) {
      return { build: null, start: "python manage.py runserver" };
    }
    if (frameworks.includes("fastapi")) {
      return { build: null, start: "uvicorn main:app" };
    }
    if (frameworks.includes("flask")) {
      return { build: null, start: "flask run" };
    }
  }

  return { build: null, start: null };
}
