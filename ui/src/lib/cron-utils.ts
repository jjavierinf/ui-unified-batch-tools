export function describeCron(expr: string): string {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return "Invalid cron";

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  const isWild = (v: string) => v === "*";

  if (minute.startsWith("*/") && isWild(hour) && isWild(dayOfMonth) && isWild(month) && isWild(dayOfWeek)) {
    const n = parseInt(minute.slice(2), 10);
    if (!isNaN(n)) return n === 1 ? "Every minute" : `Every ${n} min`;
  }

  if (minute === "0" && isWild(hour) && isWild(dayOfMonth) && isWild(month) && isWild(dayOfWeek)) {
    return "Every hour";
  }

  if (/^\d+$/.test(minute) && isWild(hour) && isWild(dayOfMonth) && isWild(month) && isWild(dayOfWeek)) {
    return `Hourly at :${minute.padStart(2, "0")}`;
  }

  if (/^\d+$/.test(minute) && /^\d+$/.test(hour) && isWild(dayOfMonth) && isWild(month) && isWild(dayOfWeek)) {
    return `Daily at ${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
  }

  if (/^\d+$/.test(minute) && hour.includes(",") && isWild(dayOfMonth) && isWild(month) && isWild(dayOfWeek)) {
    const hours = hour.split(",").map((h) => parseInt(h, 10)).sort((a, b) => a - b);
    if (hours.length >= 2) {
      const diff = hours[1] - hours[0];
      const isEvenlySpaced = hours.every((h, i) => i === 0 || h - hours[i - 1] === diff);
      if (isEvenlySpaced) return `Every ${diff}h`;
    }
    return `${hours.length}x daily`;
  }

  if (minute === "0" && hour.startsWith("*/") && isWild(dayOfMonth) && isWild(month) && isWild(dayOfWeek)) {
    const n = parseInt(hour.slice(2), 10);
    if (!isNaN(n)) return n === 1 ? "Every hour" : `Every ${n}h`;
  }

  return "Custom";
}

/**
 * Calculate approximate minutes until next cron run.
 * Simplified parser covering common patterns used in mock data.
 */
export function nextRunMinutes(expr: string): number | null {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return null;

  const [minuteExpr, hourExpr, dom, mon, dow] = parts;
  const isWild = (v: string) => v === "*";

  if (!isWild(dom) || !isWild(mon) || !isWild(dow)) return null;

  const now = new Date();
  const currentMinute = now.getMinutes();
  const currentHour = now.getHours();

  // */N * * * * — every N minutes
  if (minuteExpr.startsWith("*/") && isWild(hourExpr)) {
    const interval = parseInt(minuteExpr.slice(2), 10);
    if (isNaN(interval) || interval <= 0) return null;
    const remainder = currentMinute % interval;
    return remainder === 0 ? interval : interval - remainder;
  }

  // M * * * * — every hour at minute M
  if (/^\d+$/.test(minuteExpr) && isWild(hourExpr)) {
    const targetMinute = parseInt(minuteExpr, 10);
    let diff = targetMinute - currentMinute;
    if (diff <= 0) diff += 60;
    return diff;
  }

  // M H * * * — daily at H:M
  if (/^\d+$/.test(minuteExpr) && /^\d+$/.test(hourExpr)) {
    const targetMinute = parseInt(minuteExpr, 10);
    const targetHour = parseInt(hourExpr, 10);
    let diff = (targetHour - currentHour) * 60 + (targetMinute - currentMinute);
    if (diff <= 0) diff += 24 * 60;
    return diff;
  }

  // M H1,H2,... * * * — multiple times per day
  if (/^\d+$/.test(minuteExpr) && hourExpr.includes(",")) {
    const targetMinute = parseInt(minuteExpr, 10);
    const hours = hourExpr.split(",").map((h) => parseInt(h, 10)).sort((a, b) => a - b);
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    for (const h of hours) {
      const targetTotal = h * 60 + targetMinute;
      if (targetTotal > currentTotalMinutes) {
        return targetTotal - currentTotalMinutes;
      }
    }
    // Wrap to first run tomorrow
    const firstTomorrow = hours[0] * 60 + targetMinute + 24 * 60;
    return firstTomorrow - currentTotalMinutes;
  }

  // 0 */N * * * — every N hours
  if (minuteExpr === "0" && hourExpr.startsWith("*/")) {
    const interval = parseInt(hourExpr.slice(2), 10);
    if (isNaN(interval) || interval <= 0) return null;
    const remainder = currentHour % interval;
    const hoursUntil = remainder === 0 ? interval : interval - remainder;
    return hoursUntil * 60 - currentMinute;
  }

  return null;
}

export function formatNextRun(minutes: number): string {
  if (minutes < 1) return "< 1m";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
