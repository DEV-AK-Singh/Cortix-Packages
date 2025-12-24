import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { connectDB } from "./config/db";
import { connectRedis } from "./config/redis";
import { connectPrisma } from "./config/prisma";

const PORT = process.env.PORT || 4000;

async function start() {
    await connectPrisma();
    console.log("Prisma connected!");
    await connectRedis();
    console.log("Redis connected!");
    await connectDB();
    console.log("Postgres connected!");
    app.listen(PORT, () => {
        console.log(`🚀 Cortix backend running on port ${PORT}!!`);
    });
}

start();