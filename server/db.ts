import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function getSanitizedDbUrl(): string {
  const envUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;

  if (!envUrl) {
    throw new Error("DATABASE_URL environment variable is not configured.");
  }

  // Catch unreplaced CI/CD template variables (${{...}}) or placeholder values
  if (
    envUrl.includes("${{") ||
    envUrl.includes("db.prisma.io") ||
    envUrl.includes("postgres://postgres:")
  ) {
    throw new Error("DATABASE_URL contains invalid placeholder or unsupported template variable.");
  }

  try {
    const parsed = new URL(envUrl);
    if (!parsed.protocol.startsWith("postgres") || !parsed.hostname) {
      throw new Error("Invalid PostgreSQL connection string in DATABASE_URL.");
    }
    return envUrl;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    throw new Error(`Failed to parse DATABASE_URL: ${message}`);
  }
}

const createPrismaClient = () => {
  const nodeEnv = process.env.NODE_ENV;
  const dbUrl = getSanitizedDbUrl();

  const pool = new Pool({ connectionString: dbUrl });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: nodeEnv === "development" ? ["query", "error", "warn"] : ["error"],
  });
};

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

// Singleton Prisma instance to prevent connection leakage in serverless environments
export const db = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = db;
