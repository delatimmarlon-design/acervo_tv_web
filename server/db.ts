import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, Video, InsertVideo, videos, UserPermission, InsertUserPermission, userPermissions, UserInvitation, InsertUserInvitation, userInvitations, ProgramSchedule, InsertProgramSchedule, programSchedules, ImportAlert, InsertImportAlert, importAlerts } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    // Check if user exists
    const existing = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);
    
    if (existing.length > 0) {
      // Update existing user
      const updateData: Record<string, any> = { updatedAt: new Date(), lastSignedIn: new Date() };
      if (user.name) updateData.name = user.name;
      if (user.email) updateData.email = user.email;
      if (user.loginMethod) updateData.loginMethod = user.loginMethod;
      
      await db.update(users).set(updateData).where(eq(users.openId, user.openId));
    } else {
      // Insert new user
      await db.insert(users).values({
        openId: user.openId,
        name: user.name || null,
        email: user.email || null,
        loginMethod: user.loginMethod || null,
      });
    }
  } catch (error) {
    console.error('[Database] Failed to upsert user:', error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string): Promise<InsertUser | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Video queries
export async function createVideo(video: InsertVideo): Promise<Video | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(videos).values(video);
    const videoId = (result as any).insertId;
    return await db.select().from(videos).where(eq(videos.id, videoId)).limit(1).then(r => r[0] || null);
  } catch (error) {
    console.error('[Database] Failed to create video:', error);
    throw error;
  }
}

export async function getVideoById(id: number): Promise<Video | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('[Database] Failed to get video:', error);
    throw error;
  }
}

export async function updateVideo(id: number, updates: Partial<InsertVideo>): Promise<Video | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    await db.update(videos).set({ ...updates, updatedAt: new Date() }).where(eq(videos.id, id));
    return await getVideoById(id);
  } catch (error) {
    console.error('[Database] Failed to update video:', error);
    throw error;
  }
}

export async function deleteVideo(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.delete(videos).where(eq(videos.id, id));
    return true;
  } catch (error) {
    console.error('[Database] Failed to delete video:', error);
    throw error;
  }
}

// User permissions queries
export async function getUserPermissions(userId: number, ownerUserId: number): Promise<UserPermission | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.select().from(userPermissions).where(and(eq(userPermissions.userId, userId), eq(userPermissions.ownerUserId, ownerUserId))).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('[Database] Failed to get user permissions:', error);
    throw error;
  }
}

export async function listUserPermissions(ownerUserId: number): Promise<UserPermission[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(userPermissions).where(eq(userPermissions.ownerUserId, ownerUserId));
  } catch (error) {
    console.error('[Database] Failed to list user permissions:', error);
    throw error;
  }
}

export async function createUserPermission(permission: InsertUserPermission): Promise<UserPermission | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(userPermissions).values(permission);
    const permissionId = (result as any).insertId;
    return await db.select().from(userPermissions).where(eq(userPermissions.id, permissionId)).limit(1).then(r => r[0] || null);
  } catch (error) {
    console.error('[Database] Failed to create user permission:', error);
    throw error;
  }
}

export async function updateUserPermission(ownerUserId: number, userId: number, permissionLevel: string): Promise<UserPermission | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.select().from(userPermissions).where(and(eq(userPermissions.userId, userId), eq(userPermissions.ownerUserId, ownerUserId))).limit(1);
    if (result.length === 0) return null;
    
    const permId = result[0].id;
    await db.update(userPermissions).set({ permissionLevel: permissionLevel as any, updatedAt: new Date() }).where(eq(userPermissions.id, permId));
    return await db.select().from(userPermissions).where(eq(userPermissions.id, permId)).limit(1).then(r => r[0] || null);
  } catch (error) {
    console.error('[Database] Failed to update user permission:', error);
    throw error;
  }
}

export async function deleteUserPermission(ownerUserId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.delete(userPermissions).where(and(eq(userPermissions.userId, userId), eq(userPermissions.ownerUserId, ownerUserId)));
    return true;
  } catch (error) {
    console.error('[Database] Failed to delete user permission:', error);
    throw error;
  }
}

// User invitations queries
export async function createUserInvitation(ownerUserId: number, email: string, permissionLevel: string): Promise<UserInvitation | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    const invitation: InsertUserInvitation = {
      ownerUserId,
      invitedEmail: email,
      permissionLevel: permissionLevel as any,
      token,
      expiresAt,
    };
    
    const result = await db.insert(userInvitations).values(invitation);
    const invitationId = (result as any).insertId;
    return await db.select().from(userInvitations).where(eq(userInvitations.id, invitationId)).limit(1).then(r => r[0] || null);
  } catch (error) {
    console.error('[Database] Failed to create user invitation:', error);
    throw error;
  }
}

export async function getUserInvitationByToken(token: string): Promise<UserInvitation | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.select().from(userInvitations).where(eq(userInvitations.token, token)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('[Database] Failed to get user invitation:', error);
    throw error;
  }
}

export async function listUserInvitations(ownerUserId: number): Promise<UserInvitation[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(userInvitations).where(eq(userInvitations.ownerUserId, ownerUserId));
  } catch (error) {
    console.error('[Database] Failed to list user invitations:', error);
    throw error;
  }
}

export async function acceptUserInvitation(id: number): Promise<UserInvitation | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    await db.update(userInvitations).set({ acceptedAt: new Date() }).where(eq(userInvitations.id, id));
    return await db.select().from(userInvitations).where(eq(userInvitations.id, id)).limit(1).then(r => r[0] || null);
  } catch (error) {
    console.error('[Database] Failed to accept user invitation:', error);
    throw error;
  }
}

// Program schedule queries
export async function createProgramSchedule(schedule: InsertProgramSchedule): Promise<ProgramSchedule | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(programSchedules).values(schedule);
    const scheduleId = (result as any).insertId;
    return await db.select().from(programSchedules).where(eq(programSchedules.id, scheduleId)).limit(1).then(r => r[0] || null);
  } catch (error) {
    console.error('[Database] Failed to create program schedule:', error);
    throw error;
  }
}

export async function getProgramSchedule(userId: number, programName: string): Promise<ProgramSchedule | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.select().from(programSchedules).where(and(eq(programSchedules.userId, userId), eq(programSchedules.programName, programName))).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('[Database] Failed to get program schedule:', error);
    throw error;
  }
}

// Import alerts queries
export async function createImportAlert(alert: InsertImportAlert): Promise<ImportAlert | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(importAlerts).values(alert);
    const alertId = (result as any).insertId;
    return await db.select().from(importAlerts).where(eq(importAlerts.id, alertId)).limit(1).then(r => r[0] || null);
  } catch (error) {
    console.error('[Database] Failed to create import alert:', error);
    throw error;
  }
}

export async function listImportAlerts(userId: number, status?: string): Promise<ImportAlert[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    if (status) {
      return await db.select().from(importAlerts).where(and(eq(importAlerts.userId, userId), eq(importAlerts.status, status as any)));
    }
    return await db.select().from(importAlerts).where(eq(importAlerts.userId, userId));
  } catch (error) {
    console.error('[Database] Failed to list import alerts:', error);
    throw error;
  }
}

// TODO: add feature queries here as your schema grows.
