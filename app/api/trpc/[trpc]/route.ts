import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { appRouter } from "@/server/root";
import { createContext } from "@/server/trpc";
import { authOptions } from "@/lib/auth";

/**
 * tRPC HTTP Handler for Next.js App Router
 * Endpoint: /api/trpc/[trpc]
 * Creates context with NextAuth session + Prisma db on every request.
 */
const handler = async (req: NextRequest) => {
  const session = await getServerSession(authOptions);

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(session),
    onError: ({ path, error }) => {
      console.error(`[tRPC Error] on ${path ?? "<no-path>"}:`, error.message, error.cause ?? "");
    },
  });
};

export { handler as GET, handler as POST };
