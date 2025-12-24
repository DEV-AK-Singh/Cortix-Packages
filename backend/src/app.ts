import express from "express";
import cors from "cors";
import passport from "passport";

import { db } from "./config/db";
import { redis } from "./config/redis";
import { prisma } from "./config/prisma";

import githubRoutes from "./auth/github/github.routes";
import googleRoutes from "./auth/google/google.routes";
import "./auth/google/google.service";
import userRoutes from "./auth/user/user.routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

app.use("/auth/github", githubRoutes);
app.use("/auth/google", googleRoutes);
app.use("/auth/user", userRoutes);

app.get("/health", async (_req, res) => {
    let dbStatus = "unhealthy";
    let redisStatus = "unhealthy";
    let prismaStatus = "unhealthy";
    try {
        dbStatus = (await db.query(`SELECT 1`)) ? "healthy" : "unhealthy";
        redisStatus = (await redis.ping()) === "PONG" ? "healthy" : "unhealthy";
        prismaStatus = (await prisma.$queryRaw`SELECT 1`) ? "healthy" : "unhealthy";
        res.json({ status: "ok", details: { db: dbStatus, redis: redisStatus, prisma: prismaStatus } });
    } catch {
        res.status(500).json({ status: "unhealthy", details: { db: dbStatus, redis: redisStatus, prisma: prismaStatus } });
    }
});

export default app;
