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
