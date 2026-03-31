import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { createVideo, getVideoById, updateVideo, deleteVideo, listUserPermissions, createUserPermission, updateUserPermission, deleteUserPermission, createUserInvitation, listUserInvitations, acceptUserInvitation } from "./db";
import { getDb } from "./db";
import { videos } from "../drizzle/schema";
import { eq, and, or, like, between, desc, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

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
  }),

  video: router({
    // Create a new video
    create: protectedProcedure
      .input(createVideoSchema)
      .mutation(async ({ input, ctx }) => {
        try {
          const video = await createVideo({
            userId: ctx.user.id,
            ...input,
          });
          if (!video) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create video" });
          }
          return video;
        } catch (error) {
          console.error("[tRPC] Failed to create video:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create video" });
        }
      }),

    // Get video by ID
    getById: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .query(async ({ input, ctx }) => {
        try {
          const video = await getVideoById(input.id);
          if (!video || video.userId !== ctx.user.id) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Video not found" });
          }
          return video;
        } catch (error) {
          console.error("[tRPC] Failed to get video:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get video" });
        }
      }),

    // Update video
    update: protectedProcedure
      .input(z.object({ id: z.number().int(), data: updateVideoSchema }))
      .mutation(async ({ input, ctx }) => {
        try {
          const existing = await getVideoById(input.id);
          if (!existing || existing.userId !== ctx.user.id) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Video not found" });
          }
          const updated = await updateVideo(input.id, input.data);
          if (!updated) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update video" });
          }
          return updated;
        } catch (error) {
          console.error("[tRPC] Failed to update video:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update video" });
        }
      }),

    // Delete video
    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input, ctx }) => {
        try {
          const existing = await getVideoById(input.id);
          if (!existing || existing.userId !== ctx.user.id) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Video not found" });
          }
          await deleteVideo(input.id);
          return { success: true };
        } catch (error) {
          console.error("[tRPC] Failed to delete video:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to delete video" });
        }
      }),

    // Search and filter videos
    search: protectedProcedure
      .input(searchVideoSchema)
      .query(async ({ input, ctx }) => {
        try {
          const db = await getDb();
          if (!db) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
          }

          // Build WHERE conditions
          const conditions: any[] = [eq(videos.userId, ctx.user.id)];

          if (input.programName) {
            conditions.push(like(videos.programName, `%${input.programName}%`));
          }
          if (input.channel) {
            conditions.push(like(videos.channel, `%${input.channel}%`));
          }
          if (input.programType) {
            conditions.push(eq(videos.programType, input.programType));
          }
          if (input.hdNumber) {
            conditions.push(eq(videos.hdNumber, input.hdNumber));
          }

          // Determine sort order
          const sortColumn = {
            programName: videos.programName,
            broadcastDate: videos.broadcastDate,
            channel: videos.channel,
            createdAt: videos.createdAt,
          }[input.sortBy];

          const orderBy = input.sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

          // Get total count
          const countQuery = db.select({ count: videos.id }).from(videos).where(and(...conditions));
          const countResult = await countQuery;
          const total = countResult.length;

          // Get paginated results
          const offset = (input.page - 1) * input.limit;
          const results = await db
            .select()
            .from(videos)
            .where(and(...conditions))
            .orderBy(orderBy)
            .limit(input.limit)
            .offset(offset);

          return {
            data: results,
            total,
            page: input.page,
            limit: input.limit,
            pages: Math.ceil(total / input.limit),
          };
        } catch (error) {
          console.error("[tRPC] Failed to search videos:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to search videos" });
        }
      }),

    // Get all videos for export (no pagination)
    getAllForExport: protectedProcedure
      .input(searchVideoSchema.omit({ page: true, limit: true }))
      .query(async ({ input, ctx }) => {
        try {
          const db = await getDb();
          if (!db) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
          }

          const conditions: any[] = [eq(videos.userId, ctx.user.id)];

          if (input.programName) {
            conditions.push(like(videos.programName, `%${input.programName}%`));
          }
          if (input.channel) {
            conditions.push(like(videos.channel, `%${input.channel}%`));
          }
          if (input.programType) {
            conditions.push(eq(videos.programType, input.programType));
          }
          if (input.hdNumber) {
            conditions.push(eq(videos.hdNumber, input.hdNumber));
          }

          const sortColumn = {
            programName: videos.programName,
            broadcastDate: videos.broadcastDate,
            channel: videos.channel,
            createdAt: videos.createdAt,
          }[input.sortBy];

          const orderBy = input.sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

          const results = await db
            .select()
            .from(videos)
            .where(and(...conditions))
            .orderBy(orderBy)
            .limit(10000); // Max 10k records for export

          return results;
        } catch (error) {
          console.error("[tRPC] Failed to get videos for export:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get videos for export" });
        }
      }),
  }),

  admin: router({
    // List all users with permissions for the current user's catalog
    listUsers: protectedProcedure.query(async ({ ctx }) => {
      try {
        const permissions = await listUserPermissions(ctx.user.id);
        return permissions;
      } catch (error) {
        console.error("[tRPC] Failed to list users:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to list users" });
      }
    }),

    // Invite a user to access the catalog
    inviteUser: protectedProcedure
      .input(z.object({
        email: z.string().email("Email inválido"),
        permissionLevel: z.enum(["viewer", "editor", "admin"]).default("viewer"),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

          const invitation = await createUserInvitation({
            ownerUserId: ctx.user.id,
            invitedEmail: input.email,
            permissionLevel: input.permissionLevel,
            token,
            expiresAt,
          });

          return {
            success: true,
            invitation,
            inviteLink: `${process.env.VITE_FRONTEND_URL || 'http://localhost:3000'}/accept-invite?token=${token}`,
          };
        } catch (error) {
          console.error("[tRPC] Failed to invite user:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to invite user" });
        }
      }),

    // Update user permissions
    updateUserPermission: protectedProcedure
      .input(z.object({
        permissionId: z.number(),
        permissionLevel: z.enum(["viewer", "editor", "admin"]),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const updated = await updateUserPermission(input.permissionId, {
            permissionLevel: input.permissionLevel,
          });
          return { success: true, permission: updated };
        } catch (error) {
          console.error("[tRPC] Failed to update user permission:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update user permission" });
        }
      }),

    // Remove user access
    removeUser: protectedProcedure
      .input(z.object({
        permissionId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const success = await deleteUserPermission(input.permissionId);
          return { success };
        } catch (error) {
          console.error("[tRPC] Failed to remove user:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to remove user" });
        }
      }),

    // List pending invitations
    listInvitations: protectedProcedure.query(async ({ ctx }) => {
      try {
        const invitations = await listUserInvitations(ctx.user.id);
        return invitations;
      } catch (error) {
        console.error("[tRPC] Failed to list invitations:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to list invitations" });
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
