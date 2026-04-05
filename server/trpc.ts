import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import type { Session } from "next-auth";
import { db } from "@/server/db";
import type { PrismaClient } from "@prisma/client";

/**
 * tRPC Context
 * Contains the Prisma db client and the authenticated NextAuth session.
 * Available as `ctx.db` and `ctx.session` in every procedure.
 */
export interface Context {
  session: Session | null;
  db: PrismaClient;
}

export function createContext(session: Session | null): Context {
  return { session, db };
}

/**
 * Create tRPC instance with superjson transformer
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

/**
 * Public procedure — no authentication required
 * Used for: product catalog, search, public order tracking
 */
export const publicProcedure = t.procedure;

/**
 * Protected procedure — requires authenticated session
 * Used for: cart, orders, profile, wishlist
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

/**
 * Admin-only procedure — requires ADMIN role (NFR-SEC-04)
 * Used for: product management, all reports, system config
 */
export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (ctx.session.user.role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required." });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});

/**
 * Branch Manager procedure — requires BRANCH_MANAGER or ADMIN role
 * Used for: branch operations, order fulfillment, inventory management
 */
export const branchManagerProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  const role = ctx.session.user.role;
  if (role !== "BRANCH_MANAGER" && role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Branch manager access required." });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});
