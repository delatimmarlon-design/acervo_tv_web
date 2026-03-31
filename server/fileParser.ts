/**
 * File parser utilities for automatic video import
 * Parses filenames in format: PROGRAMA DD-MM-AAAA.mp4
 */

export interface ParsedFile {
  programName: string;
  broadcastDate: string; // dd/mm/aaaa format
  day: number; // 0-6 where 0=Sunday
  month: number; // 1-12
  year: number;
  isValid: boolean;
  error?: string;
}

/**
 * Parse filename in format: PROGRAMA DD-MM-AAAA.mp4
 * Returns parsed program name, date, and validation status
 */
export function parseVideoFilename(filename: string): ParsedFile {
  // Remove extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
  
  // Pattern: NAME DD-MM-AAAA
  const pattern = /^(.+?)\s+(\d{2})-(\d{2})-(\d{4})$/;
  const match = nameWithoutExt.match(pattern);
  
  if (!match) {
    return {
      programName: "",
      broadcastDate: "",
      day: 0,
      month: 0,
      year: 0,
      isValid: false,
      error: "Filename must follow format: PROGRAMA DD-MM-AAAA.mp4"
    };
  }
  
  const [, programName, day, month, year] = match;
  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);
  
  // Validate date
  if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900 || yearNum > 2100) {
    return {
      programName: programName.trim(),
      broadcastDate: "",
      day: dayNum,
      month: monthNum,
      year: yearNum,
      isValid: false,
      error: "Invalid date in filename"
    };
  }
  
  // Get day of week (0=Sunday, 6=Saturday)
  const date = new Date(yearNum, monthNum - 1, dayNum);
  const dayOfWeek = date.getDay();
  
  const broadcastDate = `${day}/${month}/${year}`;
  
  return {
    programName: programName.trim(),
    broadcastDate,
    day: dayOfWeek,
    month: monthNum,
    year: yearNum,
    isValid: true
  };
}

/**
 * Check if broadcast date is unusual for the program schedule
 * Returns true if date is NOT in the expected days of week
 */
export function isUnusualBroadcastDate(dayOfWeek: number, expectedDaysOfWeek: number[]): boolean {
  return !expectedDaysOfWeek.includes(dayOfWeek);
}

/**
 * Get day name from day of week number
 */
export function getDayName(dayOfWeek: number): string {
  const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  return days[dayOfWeek] || "Desconhecido";
}

/**
 * Format date string from components
 */
export function formatDate(day: number, month: number, year: number): string {
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

/**
 * Parse days of week from JSON array
 */
export function parseDaysOfWeek(daysJson: string): number[] {
  try {
    const days = JSON.parse(daysJson);
    if (Array.isArray(days) && days.every(d => typeof d === "number" && d >= 0 && d <= 6)) {
      return days;
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Detect missing episodes between two dates
 * Returns array of missing dates
 */
export function detectMissingEpisodes(
  existingDates: string[], // format: dd/mm/aaaa
  daysOfWeek: number[],
  startDate: Date,
  endDate: Date
): string[] {
  const missing: string[] = [];
  const existingSet = new Set(existingDates);
  
  // Iterate through date range
  const current = new Date(startDate);
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    
    // If this day should have an episode
    if (daysOfWeek.includes(dayOfWeek)) {
      const dateStr = formatDate(current.getDate(), current.getMonth() + 1, current.getFullYear());
      
      // If episode is missing
      if (!existingSet.has(dateStr)) {
        missing.push(dateStr);
      }
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  return missing;
}
