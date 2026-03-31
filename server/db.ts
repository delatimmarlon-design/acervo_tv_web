import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, Video, InsertVideo, videos, UserPermission, InsertUserPermission, userPermissions, UserInvitation, InsertUserInvitation, userInvitations } from "../drizzle/schema";
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
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
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

export async function updateUserPermission(id: number, updates: Partial<InsertUserPermission>): Promise<UserPermission | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    await db.update(userPermissions).set({ ...updates, updatedAt: new Date() }).where(eq(userPermissions.id, id));
    return await db.select().from(userPermissions).where(eq(userPermissions.id, id)).limit(1).then(r => r[0] || null);
  } catch (error) {
    console.error('[Database] Failed to update user permission:', error);
    throw error;
  }
}

export async function deleteUserPermission(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.delete(userPermissions).where(eq(userPermissions.id, id));
    return true;
  } catch (error) {
    console.error('[Database] Failed to delete user permission:', error);
    throw error;
  }
}

// User invitations queries
export async function createUserInvitation(invitation: InsertUserInvitation): Promise<UserInvitation | null> {
  const db = await getDb();
  if (!db) return null;

  try {
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

// TODO: add feature queries here as your schema grows.
