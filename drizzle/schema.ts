import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  masterPassword: text("masterPassword"), // Hashed master password for quick access (owner only)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Videos table for storing TV program information
 * Supports cataloging of TV shows, news programs, series, and variety shows
 */
export const videos = mysqlTable(
  "videos",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(), // Foreign key to users table
    programName: varchar("programName", { length: 255 }).notNull(), // Nome do programa (ex: JORNAL NACIONAL)
    broadcastDate: varchar("broadcastDate", { length: 10 }).notNull(), // Data de exibição (dd/mm/aaaa)
    channel: varchar("channel", { length: 100 }).notNull(), // Canal de origem (ex: Globo, SBT, Band)
    hdNumber: int("hdNumber").notNull(), // Número do HD onde o arquivo está armazenado
    programType: mysqlEnum("programType", ["Telejornal", "Novela", "Série", "Variedade"]).notNull(), // Tipo de programa
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("userIdIdx").on(table.userId),
    programNameIdx: index("programNameIdx").on(table.programName),
    broadcastDateIdx: index("broadcastDateIdx").on(table.broadcastDate),
    channelIdx: index("channelIdx").on(table.channel),
    hdNumberIdx: index("hdNumberIdx").on(table.hdNumber),
    programTypeIdx: index("programTypeIdx").on(table.programType),
  })
);

export type Video = typeof videos.$inferSelect;
export type InsertVideo = typeof videos.$inferInsert;

/**
 * User permissions table for managing access control
 * Links users to projects/workspaces with specific permission levels
 */
export const userPermissions = mysqlTable(
  "userPermissions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(), // User being granted permission
    ownerUserId: int("ownerUserId").notNull(), // Owner of the catalog
    permissionLevel: mysqlEnum("permissionLevel", ["viewer", "editor", "admin"]).default("viewer").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("userPermissionUserIdIdx").on(table.userId),
    ownerUserIdIdx: index("userPermissionOwnerUserIdIdx").on(table.ownerUserId),
  })
);

export type UserPermission = typeof userPermissions.$inferSelect;
export type InsertUserPermission = typeof userPermissions.$inferInsert;

/**
 * User invitations table for managing access invites
 * Stores pending invitations for users to join a catalog
 */
export const userInvitations = mysqlTable(
  "userInvitations",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerUserId: int("ownerUserId").notNull(), // Owner sending the invitation
    invitedEmail: varchar("invitedEmail", { length: 320 }).notNull(), // Email of invited user
    permissionLevel: mysqlEnum("permissionLevel", ["viewer", "editor", "admin"]).default("viewer").notNull(),
    token: varchar("token", { length: 255 }).notNull().unique(), // Unique token for invitation link
    expiresAt: timestamp("expiresAt").notNull(), // Invitation expiration time
    acceptedAt: timestamp("acceptedAt"), // When the invitation was accepted
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    ownerUserIdIdx: index("invitationOwnerUserIdIdx").on(table.ownerUserId),
    tokenIdx: index("invitationTokenIdx").on(table.token),
  })
);

export type UserInvitation = typeof userInvitations.$inferSelect;
export type InsertUserInvitation = typeof userInvitations.$inferInsert;

/**
 * Program schedule table for storing broadcast days of each program
 * Tracks which days of the week a program is normally broadcast
 */
export const programSchedules = mysqlTable(
  "programSchedules",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    programName: varchar("programName", { length: 255 }).notNull(),
    daysOfWeek: text("daysOfWeek").notNull(), // JSON array: [0-6]
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("scheduleUserIdIdx").on(table.userId),
    programNameIdx: index("scheduleProgramNameIdx").on(table.programName),
  })
);

export type ProgramSchedule = typeof programSchedules.$inferSelect;
export type InsertProgramSchedule = typeof programSchedules.$inferInsert;

/**
 * Import alerts table for tracking inconsistencies and missing episodes
 */
export const importAlerts = mysqlTable(
  "importAlerts",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    programName: varchar("programName", { length: 255 }).notNull(),
    alertType: mysqlEnum("alertType", ["unusual_date", "missing_episode", "disk_space"]).notNull(),
    alertMessage: text("alertMessage").notNull(),
    broadcastDate: varchar("broadcastDate", { length: 10 }),
    status: mysqlEnum("status", ["pending", "acknowledged", "resolved"]).default("pending").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("alertUserIdIdx").on(table.userId),
    programNameIdx: index("alertProgramNameIdx").on(table.programName),
    statusIdx: index("alertStatusIdx").on(table.status),
  })
);

export type ImportAlert = typeof importAlerts.$inferSelect;
export type InsertImportAlert = typeof importAlerts.$inferInsert;
