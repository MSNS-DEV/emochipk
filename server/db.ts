import { PrismaClient } from "@prisma/client";

const createPrismaClient = () => {
  const nodeEnv = process.env.NODE_ENV;
  return new PrismaClient({
    log: nodeEnv === "development" ? ["query", "error", "warn"] : ["error"],
  });
};

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

const nodeEnv = process.env.NODE_ENV;
if ((nodeEnv ?? "production") !== "production") globalForPrisma.prisma = db;
