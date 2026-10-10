export type AdminOrderStatus =
  | "PENDING"
  | "PAID"
  | "PACKED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export type AdminFulfillment = "DELIVERY" | "PICKUP";

export type OrderQueue = "open" | "fulfilled" | "cancelled" | "all";

export function isOpenOrder(status: string) {
  return status === "PAID" || status === "PACKED" || status === "OUT_FOR_DELIVERY";
}

export function orderQueue(status: string): Exclude<OrderQueue, "all"> {
  if (status === "DELIVERED") return "fulfilled";
  if (status === "CANCELLED") return "cancelled";
  return "open";
}

export function fulfillmentLabel(status: string, fulfillment: AdminFulfillment) {
  if (status === "CANCELLED") return "Cancelled";
  if (status === "DELIVERED") return fulfillment === "PICKUP" ? "Picked up" : "Delivered";
  if (status === "OUT_FOR_DELIVERY") return "Out for delivery";
  if (status === "PACKED") return fulfillment === "PICKUP" ? "Ready for pickup" : "Packed";
  if (status === "PAID") return "Unfulfilled";
  return "Unpaid";
}

export function nextOrderStep(
  status: AdminOrderStatus,
  fulfillment: AdminFulfillment,
): { status: AdminOrderStatus; label: string } | null {
  if (status === "PAID") {
    return fulfillment === "PICKUP"
      ? { status: "PACKED", label: "Ready for pickup" }
      : { status: "PACKED", label: "Mark packed" };
  }
  if (status === "PACKED") {
    return fulfillment === "PICKUP"
      ? { status: "DELIVERED", label: "Mark picked up" }
      : { status: "OUT_FOR_DELIVERY", label: "Out for delivery" };
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
  if (to === "CANCELLED") return from !== "DELIVERED" && from !== "CANCELLED";
  return nextOrderStep(from, fulfillment)?.status === to;
}

export const orderSteps = (fulfillment: AdminFulfillment): AdminOrderStatus[] =>
  fulfillment === "PICKUP"
    ? ["PAID", "PACKED", "DELIVERED"]
    : ["PAID", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED"];
