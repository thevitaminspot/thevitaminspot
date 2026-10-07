type OrderRow = {
  status: string;
  createdAt: Date;
};

export const orderGroupMeta = [
  {
    key: "attention",
    title: "Needs attention",
    description: "Unpaid or paid and waiting to be packed.",
    uncapped: true,
    match: (order: OrderRow) =>
      order.status === "PENDING" || order.status === "PAID",
  },
  {
    key: "fulfillment",
    title: "In fulfillment",
    description: "Packed or on the way to the customer.",
    label: "in fulfillment",
    match: (order: OrderRow) =>
      order.status === "PACKED" || order.status === "OUT_FOR_DELIVERY",
  },
  {
    key: "closed",
    title: "Completed",
    description: "Delivered or cancelled orders.",
    label: "completed",
    match: (order: OrderRow) =>
      order.status === "DELIVERED" || order.status === "CANCELLED",
  },
] as const;

export function groupAdminOrders<T extends OrderRow>(rows: T[]) {
  const sorted = [...rows].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return orderGroupMeta
    .map((group) => {
      const { match, ...meta } = group;
      return {
        ...meta,
        rows: sorted.filter(match),
      };
    })
    .filter((group) => group.rows.length > 0);
}
