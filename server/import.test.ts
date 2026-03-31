import { describe, it, expect } from "vitest";

// Test the import validation logic
describe("Import Validation", () => {
  const pattern = /^(.+?)\s+(\d{2})-(\d{2})-(\d{4})\.mp4$/i;

  const validateFilename = (filename: string) => {
    const match = filename.match(pattern);

    if (!match) {
      return {
        valid: false,
        error: "Formato inválido. Use: PROGRAMA DD-MM-YYYY.mp4",
      };
    }

    const [, programName, day, month, year] = match;
    const broadcastDate = `${day}/${month}/${year}`;

    const dayNum = parseInt(day);
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    if (monthNum < 1 || monthNum > 12) {
      return {
        valid: false,
        error: `Mês inválido: ${month}. Use 01-12.`,
      };
    }

    if (dayNum < 1 || dayNum > 31) {
      return {
        valid: false,
        error: `Dia inválido: ${day}. Use 01-31.`,
      };
    }

    return {
      valid: true,
      programName: programName.trim(),
      broadcastDate,
      filename,
    };
  };

  it("should validate correct filename format", () => {
    const result = validateFilename("Jornal Nacional 15-03-2024.mp4");
    expect(result.valid).toBe(true);
    expect(result.programName).toBe("Jornal Nacional");
    expect(result.broadcastDate).toBe("15/03/2024");
  });

  it("should reject filename without date", () => {
    const result = validateFilename("Jornal Nacional.mp4");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Formato inválido");
  });

  it("should reject filename with invalid month", () => {
    const result = validateFilename("Jornal Nacional 15-13-2024.mp4");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Mês inválido");
  });

  it("should reject filename with invalid day", () => {
    const result = validateFilename("Jornal Nacional 32-03-2024.mp4");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Dia inválido");
  });

  it("should accept filename with leading/trailing spaces in program name", () => {
    const result = validateFilename("Novela das Oito  15-03-2024.mp4");
    expect(result.valid).toBe(true);
    expect(result.programName).toBe("Novela das Oito");
  });

  it("should handle case-insensitive .mp4 extension", () => {
    const result = validateFilename("Série Especial 15-03-2024.MP4");
    expect(result.valid).toBe(true);
    expect(result.programName).toBe("Série Especial");
  });

  it("should validate edge dates", () => {
    const result1 = validateFilename("Programa 01-01-2024.mp4");
    expect(result1.valid).toBe(true);

    const result2 = validateFilename("Programa 31-12-2024.mp4");
    expect(result2.valid).toBe(true);
  });

  it("should reject filename without .mp4 extension", () => {
    const result = validateFilename("Jornal Nacional 15-03-2024.avi");
    expect(result.valid).toBe(false);
  });
});
