import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { createVideo, getVideoById, updateVideo, deleteVideo, listUserPermissions, createUserPermission, updateUserPermission, deleteUserPermission, createUserInvitation, listUserInvitations, acceptUserInvitation } from "./db";
import { getDb } from "./db";
import { videos, users } from "../drizzle/schema";
import { eq, and, or, like, between, desc, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import bcryptjs from "bcryptjs";

// Validation schemas
const createVideoSchema = z.object({
  programName: z.string().min(1, "Nome do programa é obrigatório").max(255),
  broadcastDate: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, "Data deve estar no formato dd/mm/aaaa"),
  channel: z.string().min(1, "Canal é obrigatório").max(100),
  hdNumber: z.number().int().positive("Número do HD deve ser positivo"),
  programType: z.enum(["Telejornal", "Novela", "Série", "Variedade"]),
});

const updateVideoSchema = createVideoSchema.partial();

const searchVideoSchema = z.object({
  programName: z.string().optional(),
  channel: z.string().optional(),
  programType: z.enum(["Telejornal", "Novela", "Série", "Variedade"]).optional(),
  hdNumber: z.number().int().optional(),
  dateFrom: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/).optional(),
  dateTo: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().default(50),
  sortBy: z.enum(["programName", "broadcastDate", "channel", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    setMasterPassword: protectedProcedure
      .input(z.object({ password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres") }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem definir senha mestre" });
        }
        
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(input.password, salt);
        
        await db.update(users).set({ masterPassword: hashedPassword }).where(eq(users.id, ctx.user.id));
        
        return { success: true, message: "Senha mestre definida com sucesso" };
      }),
    verifyMasterPassword: publicProcedure
      .input(z.object({ password: z.string() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        
        const adminUsers = await db.select().from(users).where(eq(users.role, "admin"));
        const adminWithPassword = adminUsers.find(u => u.masterPassword);
        
        if (!adminWithPassword) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Senha mestre não configurada" });
        }
        
        const isValid = await bcryptjs.compare(input.password, adminWithPassword.masterPassword);
        if (!isValid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Senha mestre incorreta" });
        }
        
        const { masterPassword, ...userWithoutPassword } = adminWithPassword;
        return { success: true, user: userWithoutPassword, message: "Acesso concedido" };
      }),
  }),

  video: router({
    create: protectedProcedure
      .input(createVideoSchema)
      .mutation(async ({ ctx, input }) => {
        return await createVideo(ctx.user.id, input);
      }),
    list: protectedProcedure
      .input(searchVideoSchema)
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        let query = db.select().from(videos).where(eq(videos.userId, ctx.user.id));

        if (input.programName) {
          query = query.where(like(videos.programName, `%${input.programName}%`));
        }
        if (input.channel) {
          query = query.where(eq(videos.channel, input.channel));
        }
        if (input.programType) {
          query = query.where(eq(videos.programType, input.programType));
        }
        if (input.hdNumber) {
          query = query.where(eq(videos.hdNumber, input.hdNumber));
        }

        const total = await db.select({ count: videos.id }).from(videos).where(eq(videos.userId, ctx.user.id));
        const offset = (input.page - 1) * input.limit;
        
        const sortColumn = input.sortBy === "programName" ? videos.programName : 
                          input.sortBy === "broadcastDate" ? videos.broadcastDate :
                          input.sortBy === "channel" ? videos.channel : videos.createdAt;
        
        const sortFn = input.sortOrder === "asc" ? asc : desc;
        
        const result = await query.limit(input.limit).offset(offset).orderBy(sortFn(sortColumn));

        return {
          data: result,
          total: total.length > 0 ? total[0].count : 0,
          page: input.page,
          limit: input.limit,
        };
      }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), ...updateVideoSchema.shape }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return await updateVideo(ctx.user.id, id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await deleteVideo(ctx.user.id, input.id);
      }),
  }),

  admin: router({
    users: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return await listUserPermissions(ctx.user.id);
      }),
      invite: protectedProcedure
        .input(z.object({ email: z.string().email(), permission: z.enum(["viewer", "editor", "admin"]) }))
        .mutation(async ({ ctx, input }) => {
          if (ctx.user.role !== "admin") {
            throw new TRPCError({ code: "FORBIDDEN" });
          }
          return await createUserInvitation(ctx.user.id, input.email, input.permission);
        }),
      updatePermission: protectedProcedure
        .input(z.object({ userId: z.number(), permission: z.enum(["viewer", "editor", "admin"]) }))
        .mutation(async ({ ctx, input }) => {
          if (ctx.user.role !== "admin") {
            throw new TRPCError({ code: "FORBIDDEN" });
          }
          return await updateUserPermission(ctx.user.id, input.userId, input.permission);
        }),
      remove: protectedProcedure
        .input(z.object({ userId: z.number() }))
        .mutation(async ({ ctx, input }) => {
          if (ctx.user.role !== "admin") {
            throw new TRPCError({ code: "FORBIDDEN" });
          }
          return await deleteUserPermission(ctx.user.id, input.userId);
        }),
    }),
    invitations: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return await listUserInvitations(ctx.user.id);
      }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
