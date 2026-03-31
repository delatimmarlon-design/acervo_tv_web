import { describe, it, expect } from "vitest";
import { z } from "zod";

// Validation schemas (same as in routers.ts)
const createVideoSchema = z.object({
  programName: z.string().min(1, "Nome do programa é obrigatório").max(255),
  broadcastDate: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, "Data deve estar no formato dd/mm/aaaa"),
  channel: z.string().min(1, "Canal é obrigatório").max(100),
  hdNumber: z.number().int().positive("Número do HD deve ser positivo"),
  programType: z.enum(["Telejornal", "Novela", "Série", "Variedade"]),
});

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

describe("Video Schema Validation", () => {
  describe("createVideoSchema", () => {
    it("should accept valid video data", () => {
      const validData = {
        programName: "JORNAL NACIONAL",
        broadcastDate: "30/11/2016",
        channel: "Globo",
        hdNumber: 1,
        programType: "Telejornal" as const,
      };

      const result = createVideoSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject empty program name", () => {
      const invalidData = {
        programName: "",
        broadcastDate: "30/11/2016",
        channel: "Globo",
        hdNumber: 1,
        programType: "Telejornal" as const,
      };

      const result = createVideoSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject invalid date format", () => {
      const invalidData = {
        programName: "JORNAL NACIONAL",
        broadcastDate: "2016-11-30",
        channel: "Globo",
        hdNumber: 1,
        programType: "Telejornal" as const,
      };

      const result = createVideoSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject negative HD number", () => {
      const invalidData = {
        programName: "JORNAL NACIONAL",
        broadcastDate: "30/11/2016",
        channel: "Globo",
        hdNumber: -1,
        programType: "Telejornal" as const,
      };

      const result = createVideoSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject invalid program type", () => {
      const invalidData = {
        programName: "JORNAL NACIONAL",
        broadcastDate: "30/11/2016",
        channel: "Globo",
        hdNumber: 1,
        programType: "InvalidType",
      };

      const result = createVideoSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should accept all valid program types", () => {
      const types = ["Telejornal", "Novela", "Série", "Variedade"];

      types.forEach((type) => {
        const data = {
          programName: "TEST",
          broadcastDate: "01/01/2020",
          channel: "Test",
          hdNumber: 1,
          programType: type,
        };

        const result = createVideoSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("searchVideoSchema", () => {
    it("should accept valid search parameters", () => {
      const validData = {
        programName: "JORNAL",
        channel: "Globo",
        programType: "Telejornal" as const,
        hdNumber: 1,
        dateFrom: "01/01/2020",
        dateTo: "31/12/2024",
        page: 1,
        limit: 50,
        sortBy: "programName" as const,
        sortOrder: "asc" as const,
      };

      const result = searchVideoSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should use default values for pagination", () => {
      const minimalData = {};

      const result = searchVideoSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(50);
        expect(result.data.sortBy).toBe("createdAt");
        expect(result.data.sortOrder).toBe("desc");
      }
    });

    it("should reject invalid page number", () => {
      const invalidData = {
        page: 0,
      };

      const result = searchVideoSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject invalid date format in dateFrom", () => {
      const invalidData = {
        dateFrom: "2020-01-01",
      };

      const result = searchVideoSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should accept all valid sort columns", () => {
      const columns = ["programName", "broadcastDate", "channel", "createdAt"];

      columns.forEach((col) => {
        const data = {
          sortBy: col,
        };

        const result = searchVideoSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it("should accept both sort orders", () => {
      const orders = ["asc", "desc"];

      orders.forEach((order) => {
        const data = {
          sortOrder: order,
        };

        const result = searchVideoSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("Date Format Validation", () => {
    it("should accept valid dd/mm/aaaa dates", () => {
      const validDates = ["01/01/2020", "31/12/2024", "29/02/2020", "15/06/2016"];

      validDates.forEach((date) => {
        const data = {
          programName: "TEST",
          broadcastDate: date,
          channel: "Test",
          hdNumber: 1,
          programType: "Telejornal" as const,
        };

        const result = createVideoSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid date formats", () => {
      const invalidDates = ["2020-01-01", "01-01-2020", "1/1/2020", "01/01/20"];

      invalidDates.forEach((date) => {
        const data = {
          programName: "TEST",
          broadcastDate: date,
          channel: "Test",
          hdNumber: 1,
          programType: "Telejornal" as const,
        };

        const result = createVideoSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });
});
