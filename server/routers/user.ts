import { z } from "zod";
import bcrypt from "bcryptjs";
import { createTRPCRouter, publicProcedure, protectedProcedure, adminProcedure } from "@/server/trpc";

export const userRouter = createTRPCRouter({
  /** Public registration — creates User + Customer profile (FR-CRM-01) */
  register: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(8),
      phone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.user.findUnique({ where: { email: input.email.toLowerCase() } });
      if (existing) throw new Error("An account with this email already exists.");
      const hashed = await bcrypt.hash(input.password, 12);
      const user = await ctx.db.user.create({
        data: {
          email: input.email.toLowerCase(),
          password: hashed,
          name: input.name,
          phone: input.phone,
          role: "CUSTOMER",
        },
      });
      // Auto-create customer profile
      await ctx.db.customer.create({ data: { userId: user.id } });
      return { id: user.id, email: user.email, name: user.name };
    }),

  /** Change own password (protected) */
  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(8),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUniqueOrThrow({ where: { id: ctx.session.user.id } });
      const valid = await bcrypt.compare(input.currentPassword, user.password);
      if (!valid) throw new Error("Current password is incorrect.");
      const hashed = await bcrypt.hash(input.newPassword, 12);
      await ctx.db.user.update({ where: { id: user.id }, data: { password: hashed } });
      return { success: true };
    }),

  /** Admin — paginated user list */
  getAll: adminProcedure
    .input(z.object({
      page: z.number().default(1),
      pageSize: z.number().default(20),
      role: z.enum(["ADMIN", "BRANCH_MANAGER", "WAREHOUSE_STAFF", "CUSTOMER"]).optional(),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: Record<string, any> = {
        ...(input.role && { role: input.role }),
        ...(input.search && {
          OR: [
            { name: { contains: input.search, mode: "insensitive" } },
            { email: { contains: input.search, mode: "insensitive" } },
          ],
        }),
      };
      const [total, items] = await Promise.all([
        ctx.db.user.count({ where }),
        ctx.db.user.findMany({
          where,
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          orderBy: { createdAt: "desc" },
          select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true },
        }),
      ]);
      return { items, total, totalPages: Math.ceil(total / input.pageSize) };
    }),

  /** Admin — create staff user */
  create: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(8),
      phone: z.string().optional(),
      role: z.enum(["ADMIN", "BRANCH_MANAGER", "WAREHOUSE_STAFF"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.user.findUnique({ where: { email: input.email.toLowerCase() } });
      if (existing) throw new Error("Email already in use.");
      const hashed = await bcrypt.hash(input.password, 12);
      return ctx.db.user.create({
        data: { ...input, email: input.email.toLowerCase(), password: hashed },
        select: { id: true, name: true, email: true, role: true },
      });
    }),

  /** Admin — update user role / status */
  update: adminProcedure
    .input(z.object({
      id: z.string(),
      role: z.enum(["ADMIN", "BRANCH_MANAGER", "WAREHOUSE_STAFF", "CUSTOMER"]).optional(),
      isActive: z.boolean().optional(),
      name: z.string().optional(),
      phone: z.string().optional(),
    }))
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.user.update({ where: { id }, data });
    }),
});
