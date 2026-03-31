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
