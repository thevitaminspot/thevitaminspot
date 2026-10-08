export const LAGOS_TZ = "Africa/Lagos";

const lagosDateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: LAGOS_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function lagosDateKey(date: Date | string) {
  return lagosDateKeyFormatter.format(new Date(date));
}

export function formatLagos(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  },
) {
  return new Intl.DateTimeFormat("en-NG", { timeZone: LAGOS_TZ, ...options }).format(new Date(date));
}

export function formatLagosLong(date: Date | string) {
  return formatLagos(date, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function todayDateInputMin(reference = new Date()) {
  const month = String(reference.getMonth() + 1).padStart(2, "0");
  const day = String(reference.getDate()).padStart(2, "0");
  return `${reference.getFullYear()}-${month}-${day}`;
}
