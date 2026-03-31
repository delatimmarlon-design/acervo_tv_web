import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { User } from "../drizzle/schema";

// Mock user for testing
const mockUser: User = {
  id: 1,
  openId: "test-user-123",
  name: "Test User",
  email: "test@example.com",
  loginMethod: "manus",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

// Create mock context
function createMockContext(): TrpcContext {
  return {
    user: mockUser,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("video router", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    const ctx = createMockContext();
    caller = appRouter.createCaller(ctx);
  });

  describe("video.create", () => {
    it("should create a video with valid input", async () => {
      const input = {
        programName: "JORNAL NACIONAL",
        broadcastDate: "30/11/2016",
        channel: "Globo",
        hdNumber: 1,
        programType: "Telejornal" as const,
      };

      const result = await caller.video.create(input);

      expect(result).toBeDefined();
      expect(result.programName).toBe(input.programName);
      expect(result.broadcastDate).toBe(input.broadcastDate);
      expect(result.channel).toBe(input.channel);
      expect(result.hdNumber).toBe(input.hdNumber);
      expect(result.programType).toBe(input.programType);
      expect(result.userId).toBe(mockUser.id);
    });

    it("should reject video with invalid date format", async () => {
      const input = {
        programName: "JORNAL NACIONAL",
        broadcastDate: "2016-11-30", // Wrong format
        channel: "Globo",
        hdNumber: 1,
        programType: "Telejornal" as const,
      };

      await expect(caller.video.create(input as any)).rejects.toThrow();
    });

    it("should reject video with negative HD number", async () => {
      const input = {
        programName: "JORNAL NACIONAL",
        broadcastDate: "30/11/2016",
        channel: "Globo",
        hdNumber: -1,
        programType: "Telejornal" as const,
      };

      await expect(caller.video.create(input as any)).rejects.toThrow();
    });

    it("should reject video with empty program name", async () => {
      const input = {
        programName: "",
        broadcastDate: "30/11/2016",
        channel: "Globo",
        hdNumber: 1,
        programType: "Telejornal" as const,
      };

      await expect(caller.video.create(input as any)).rejects.toThrow();
    });
  });

  describe("video.search", () => {
    it("should return paginated results", async () => {
      // First create some test videos
      await caller.video.create({
        programName: "JORNAL NACIONAL",
        broadcastDate: "30/11/2016",
        channel: "Globo",
        hdNumber: 1,
        programType: "Telejornal",
      });

      const result = await caller.video.search({
        page: 1,
        limit: 50,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.pages).toBeGreaterThanOrEqual(0);
    });

    it("should filter by program name", async () => {
      await caller.video.create({
        programName: "TESTE ESPECIAL",
        broadcastDate: "01/01/2020",
        channel: "SBT",
        hdNumber: 2,
        programType: "Variedade",
      });

      const result = await caller.video.search({
        programName: "TESTE",
        page: 1,
        limit: 50,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0]?.programName).toContain("TESTE");
    });

    it("should filter by program type", async () => {
      await caller.video.create({
        programName: "NOVELA TEST",
        broadcastDate: "15/03/2021",
        channel: "Globo",
        hdNumber: 3,
        programType: "Novela",
      });

      const result = await caller.video.search({
        programType: "Novela",
        page: 1,
        limit: 50,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0]?.programType).toBe("Novela");
    });

    it("should sort by different columns", async () => {
      const result = await caller.video.search({
        page: 1,
        limit: 50,
        sortBy: "programName",
        sortOrder: "asc",
      });

      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
    });
  });

  describe("video.update", () => {
    it("should update a video", async () => {
      // Create a video first
      const created = await caller.video.create({
        programName: "ORIGINAL NAME",
        broadcastDate: "30/11/2016",
        channel: "Globo",
        hdNumber: 1,
        programType: "Telejornal",
      });

      // Update it
      const updated = await caller.video.update({
        id: created.id,
        data: {
          programName: "UPDATED NAME",
        },
      });

      expect(updated.programName).toBe("UPDATED NAME");
      expect(updated.id).toBe(created.id);
    });

    it("should reject update of non-existent video", async () => {
      await expect(
        caller.video.update({
          id: 99999,
          data: { programName: "Test" },
        })
      ).rejects.toThrow();
    });
  });

  describe("video.delete", () => {
    it("should delete a video", async () => {
      // Create a video first
      const created = await caller.video.create({
        programName: "TO DELETE",
        broadcastDate: "30/11/2016",
        channel: "Globo",
        hdNumber: 1,
        programType: "Telejornal",
      });

      // Delete it
      const result = await caller.video.delete({ id: created.id });

      expect(result.success).toBe(true);

      // Verify it's deleted
      await expect(caller.video.getById({ id: created.id })).rejects.toThrow();
    });

    it("should reject delete of non-existent video", async () => {
      await expect(caller.video.delete({ id: 99999 })).rejects.toThrow();
    });
  });

  describe("video.getAllForExport", () => {
    it("should return all videos for export", async () => {
      await caller.video.create({
        programName: "EXPORT TEST",
        broadcastDate: "01/01/2020",
        channel: "Band",
        hdNumber: 4,
        programType: "Série",
      });

      const result = await caller.video.getAllForExport({
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should respect filters in export", async () => {
      await caller.video.create({
        programName: "EXPORT FILTER TEST",
        broadcastDate: "01/01/2020",
        channel: "Globo",
        hdNumber: 5,
        programType: "Telejornal",
      });

      const result = await caller.video.getAllForExport({
        channel: "Globo",
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      expect(result.length).toBeGreaterThan(0);
      expect(result.every((v) => v.channel === "Globo")).toBe(true);
    });
  });
});
