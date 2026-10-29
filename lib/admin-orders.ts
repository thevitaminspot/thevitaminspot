export type AdminOrderStatus =
  | "PENDING"
  | "PAID"
  | "PACKED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export type AdminFulfillment = "DELIVERY" | "PICKUP";

export type OrderQueue =
  | "all"
  | "confirmed"
  | "packed"
  | "sent"
  | "delivered"
  | "cancelled";

export function isOpenOrder(status: string) {
  return status === "PAID" || status === "PACKED" || status === "OUT_FOR_DELIVERY";
}

export function orderQueue(status: string): Exclude<OrderQueue, "all"> {
  if (status === "DELIVERED") return "delivered";
  if (status === "CANCELLED") return "cancelled";
  if (status === "PACKED") return "packed";
  if (status === "OUT_FOR_DELIVERY") return "sent";
  return "confirmed";
}

export function fulfillmentLabel(status: string, fulfillment: AdminFulfillment) {
  if (status === "CANCELLED") return "Cancelled";
  if (status === "DELIVERED") return fulfillment === "PICKUP" ? "Picked up" : "Delivered";
  if (status === "OUT_FOR_DELIVERY") return "On the way";
  if (status === "PACKED") return fulfillment === "PICKUP" ? "Ready for pickup" : "Packed";
  if (status === "PAID") return "Confirmed";
  return "Awaiting payment";
}

export function nextOrderStep(
  status: AdminOrderStatus,
  fulfillment: AdminFulfillment,
): { status: AdminOrderStatus; label: string } | null {
  if (status === "PAID") {
    return fulfillment === "PICKUP"
      ? { status: "PACKED", label: "Mark ready for pickup" }
      : { status: "PACKED", label: "Mark packed" };
  }
  if (status === "PACKED") {
    return fulfillment === "PICKUP"
      ? { status: "DELIVERED", label: "Mark picked up" }
      : { status: "OUT_FOR_DELIVERY", label: "Mark on the way" };
  }
  if (status === "OUT_FOR_DELIVERY") {
    return { status: "DELIVERED", label: "Mark delivered" };
  }
  return null;
}

export function canTransitionOrder(
  from: AdminOrderStatus,
  to: AdminOrderStatus,
  fulfillment: AdminFulfillment,
) {
  if (from === to) return false;
  if (from === "PENDING" || to === "PENDING" || from === "CANCELLED") return false;
  if (to === "CANCELLED") return from !== "DELIVERED";
  const steps = orderSteps(fulfillment);
  return steps.includes(from) && steps.includes(to);
}

export const orderSteps = (fulfillment: AdminFulfillment): AdminOrderStatus[] =>
  fulfillment === "PICKUP"
    ? ["PAID", "PACKED", "DELIVERED"]
    : ["PAID", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED"];
