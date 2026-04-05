import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/root";

/**
 * T3-stack tRPC client.
 * Import `api` in client components to call tRPC procedures.
 *
 * @example
 * const { data } = api.product.getAll.useQuery({ page: 1 });
 */
export const api = createTRPCReact<AppRouter>();
