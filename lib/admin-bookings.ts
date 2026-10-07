export type BookingQueue = "requests" | "upcoming" | "completed" | "cancelled" | "all";

export function bookingQueue(status: string): Exclude<BookingQueue, "all"> {
  if (status === "CANCELLED") return "cancelled";
  if (status === "COMPLETED") return "completed";
  if (status === "PENDING") return "requests";
  return "upcoming";
}

export function isOverdueBooking(status: string, startsAt: string | Date, now = Date.now()) {
  if (status !== "CONFIRMED") return false;
  const start = startsAt instanceof Date ? startsAt.getTime() : new Date(startsAt).getTime();
  return start < now;
}
