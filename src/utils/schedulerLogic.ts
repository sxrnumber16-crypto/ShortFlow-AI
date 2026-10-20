import { Platform } from '../types/index.ts';

/**
 * Parses "HH:mm" slot string
 */
export function parseSlotTime(slot: string): { hour: number; minute: number } {
  const parts = slot.split(':');
  const hour = parseInt(parts[0], 10) || 0;
  const minute = parseInt(parts[1], 10) || 0;
  return { hour, minute };
}

/**
 * Calculates next available publishing timestamp for a given platform based on configured slots.
 * Takes the current time (UTC date object) and returns next matching ISO timestamp.
 */
export function calculateNextPublishSlot(
  currentTime: Date,
  slots: string[],
  existingJobsForPlatform: { scheduled_at: string }[],
  timezoneOffsetHours: number = 6 // Asia/Dhaka is UTC+6
): string {
  if (!slots || slots.length === 0) {
    // Default to +2 hours from now
    const fallback = new Date(currentTime.getTime() + 2 * 3600 * 1000);
    return fallback.toISOString();
  }

  // Convert current time to target timezone (Asia/Dhaka = UTC + 6)
  const tzCurrentTime = new Date(currentTime.getTime() + timezoneOffsetHours * 3600 * 1000);
  const currentHour = tzCurrentTime.getUTCHours();
  const currentMinute = tzCurrentTime.getUTCMinutes();
  const currentMinutesFromMidnight = currentHour * 60 + currentMinute;

  // Sort slots chronologically
  const sortedSlots = [...slots].sort((a, b) => {
    const sA = parseSlotTime(a);
    const sB = parseSlotTime(b);
    return sA.hour * 60 + sA.minute - (sB.hour * 60 + sB.minute);
  });

  // Check today's remaining slots, or tomorrow's first available slot
  // Also avoid scheduling collision if a slot is already taken today
  const scheduledTimestamps = new Set(
    existingJobsForPlatform.map(j => {
      // Convert to YYYY-MM-DD-HH:mm in target tz
      const d = new Date(new Date(j.scheduled_at).getTime() + timezoneOffsetHours * 3600 * 1000);
      return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}-${d.getUTCHours()}:${d.getUTCMinutes()}`;
    })
  );

  // Look up to 7 days ahead for the next free slot
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const candidateDay = new Date(tzCurrentTime.getTime() + dayOffset * 86400 * 1000);

    for (const slot of sortedSlots) {
      const { hour, minute } = parseSlotTime(slot);
      const slotMinutesFromMidnight = hour * 60 + minute;

      // If it's today, the slot must be in the future (at least 5 mins buffer)
      if (dayOffset === 0 && slotMinutesFromMidnight <= currentMinutesFromMidnight + 5) {
        continue;
      }

      const key = `${candidateDay.getUTCFullYear()}-${candidateDay.getUTCMonth()}-${candidateDay.getUTCDate()}-${hour}:${minute}`;
      if (!scheduledTimestamps.has(key)) {
        // Construct target date in UTC
        const targetYear = candidateDay.getUTCFullYear();
        const targetMonth = candidateDay.getUTCMonth();
        const targetDate = candidateDay.getUTCDate();

        // Target time in tz, then subtract offset to get UTC
        const slotInTz = Date.UTC(targetYear, targetMonth, targetDate, hour, minute, 0, 0);
        const slotInUtc = new Date(slotInTz - timezoneOffsetHours * 3600 * 1000);
        return slotInUtc.toISOString();
      }
    }
  }

  // Fallback: 1 day later
  return new Date(currentTime.getTime() + 24 * 3600 * 1000).toISOString();
}

/**
 * Calculates exponential backoff delay in milliseconds
 * base: 2 minutes (120,000ms), max: 1 hour (3,600,000ms)
 */
export function calculateBackoffMs(attempt: number, baseMinutes = 2, maxMinutes = 60): number {
  const exponent = Math.max(0, attempt - 1);
  const backoffMinutes = Math.min(baseMinutes * Math.pow(2, exponent), maxMinutes);
  return backoffMinutes * 60 * 1000;
}

/**
 * Formats ISO date into readable Bengali date & time string in Asia/Dhaka
 */
export function formatToDhakaTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString('bn-BD', {
      timeZone: 'Asia/Dhaka',
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return isoString;
  }
}
