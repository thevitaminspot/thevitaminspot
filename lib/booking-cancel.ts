export const BOOKING_CANCEL_REASONS = [
  { value: "schedule", label: "I can no longer make this time" },
  { value: "unwell", label: "I'm not feeling well enough for a session" },
  { value: "reschedule", label: "I want a different date — I'll book again" },
  { value: "plans_changed", label: "My plans changed" },
  { value: "other", label: "Something else" },
] as const;

export type BookingCancelReason = (typeof BOOKING_CANCEL_REASONS)[number]["value"];

export function cancelReasonLabel(value: string) {
  return BOOKING_CANCEL_REASONS.find((item) => item.value === value)?.label ?? value;
}

export function isBookingCancelReason(value: string): value is BookingCancelReason {
  return BOOKING_CANCEL_REASONS.some((item) => item.value === value);
}
