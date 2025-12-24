import { PrismaClient } from "../../generated/client";

export const prisma = new PrismaClient();

export async function connectPrisma() {
  try {
    await prisma.$connect();
    console.log("✅ Prisma connected");
  } catch (err) {
    console.error("❌ Prisma connection failed");
    process.exit(1);
  }
}
