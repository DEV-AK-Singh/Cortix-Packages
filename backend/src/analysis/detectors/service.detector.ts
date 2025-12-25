export function detectServices(env: any) {
    const services = [];

    if (env.required.includes("DATABASE_URL")) {
        services.push("postgres");
    }

    if (env.required.includes("REDIS_URL")) {
        services.push("redis");
    }

    return services;
}
