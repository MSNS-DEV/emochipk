import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  adminProcedure,
} from "@/server/trpc";

const BranchSchema = z.object({
  name: z.string().min(1).max(100),
  city: z.string().min(1).max(100),
  address: z.string().min(1).max(250),
  landmark: z.string().max(250).optional(),
  phone: z.string().min(1).max(20),
  managerName: z.string().min(1).max(100),
  operatingHours: z.string().max(100).optional(),
  isActive: z.boolean().default(true),
});

export const branchRouter = createTRPCRouter({
  /** List all branches (public — needed for checkout, stores page; excludes staff emails) */
  getAll: publicProcedure.query(({ ctx }) =>
    ctx.db.branch.findMany({
      where: { isActive: true },
      include: {
        branchManager: {
          include: { user: { select: { name: true } } },
        },
        _count: { select: { inventory: true, orders: true } },
      },
      orderBy: { name: "asc" },
    }),
  ),

  getById: publicProcedure.input(z.string()).query(({ ctx, input }) =>
    ctx.db.branch.findUnique({
      where: { id: input },
      include: {
        branchManager: {
          include: { user: { select: { name: true } } },
        },
        inventory: {
          include: { variant: { include: { product: true } } },
          take: 10,
        },
      },
    }),
  ),

  create: adminProcedure
    .input(BranchSchema)
    .mutation(({ ctx, input }) => ctx.db.branch.create({ data: input })),

  update: adminProcedure
    .input(BranchSchema.partial().extend({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.branch.update({ where: { id }, data });
    }),

  setActive: adminProcedure
    .input(z.object({ id: z.string(), isActive: z.boolean() }))
    .mutation(({ ctx, input }) =>
      ctx.db.branch.update({
        where: { id: input.id },
        data: { isActive: input.isActive },
      }),
    ),

  /** Admin list with inventory stats and staff details */
  adminList: adminProcedure.query(async ({ ctx }) => {
    return await ctx.db.branch.findMany({
      include: {
        branchManager: {
          include: { user: { select: { name: true, email: true } } },
        },
        _count: { select: { inventory: true, orders: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  }),
});
