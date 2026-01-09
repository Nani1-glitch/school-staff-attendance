import dayjs from 'dayjs';

/**
 * Calculate attendance metrics (late minutes, early minutes, total minutes)
 */
export function calculateAttendanceMetrics(
  timeIn,
  timeOut,
  startTime = '09:00',
  endTime = '17:00',
  graceMinutes = 15,
  halfDayMinutes = 240
) {
  const result = {
    lateMinutes: 0,
    earlyMinutes: 0,
    totalMinutes: null
  };

  if (!timeIn) {
    return result;
  }

  // Parse times
  const start = dayjs(`2000-01-01 ${startTime}`);
  const end = dayjs(`2000-01-01 ${endTime}`);
  const inTime = dayjs(`2000-01-01 ${timeIn}`);
  const outTime = timeOut ? dayjs(`2000-01-01 ${timeOut}`) : null;

  // Calculate late minutes (after grace period)
  const lateDiff = inTime.diff(start, 'minute');
  if (lateDiff > graceMinutes) {
    result.lateMinutes = lateDiff - graceMinutes;
  }

  // Calculate total minutes and early leave if checked out
  if (outTime) {
    result.totalMinutes = outTime.diff(inTime, 'minute');

    // Calculate early leave (before end time)
    const earlyDiff = end.diff(outTime, 'minute');
    if (earlyDiff > 0) {
      result.earlyMinutes = earlyDiff;
    }
  }

  return result;
}

/**
 * Format minutes to hours and minutes string
 */
export function formatMinutes(minutes) {
  if (!minutes) return '0h 0m';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}
