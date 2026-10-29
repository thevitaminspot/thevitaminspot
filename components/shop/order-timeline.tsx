const deliverySteps = [
  { id: "PAID", label: "Confirmed", hint: "Payment received" },
  { id: "PACKED", label: "Packed", hint: "Preparing your order" },
  { id: "OUT_FOR_DELIVERY", label: "On the way", hint: "Out for delivery" },
  { id: "DELIVERED", label: "Delivered", hint: "Order complete" },
] as const;

const pickupSteps = [
  { id: "PAID", label: "Confirmed", hint: "Payment received" },
  { id: "PACKED", label: "Ready", hint: "Ready for pickup" },
  { id: "DELIVERED", label: "Collected", hint: "Picked up" },
] as const;

export function OrderTimeline({
  status,
  fulfillment,
}: {
  status: string;
  fulfillment: string;
}) {
  const steps = fulfillment === "PICKUP" ? pickupSteps : deliverySteps;
  const current = steps.findIndex((step) => step.id === status);
  if (current < 0) return null;

  return (
    <ol className="mt-8 space-y-3">
      {steps.map((step, index) => {
        const reached = index <= current;
        return (
          <li key={step.id} className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] ${
                reached ? "bg-deep text-cream" : "bg-deep/8 text-deep/35"
              }`}
            >
              {index + 1}
            </span>
            <span>
              <span className={`block text-sm ${reached ? "font-medium text-deep" : "text-deep/40"}`}>
                {step.label}
              </span>
              <span className={`block text-xs ${reached ? "text-deep/55" : "text-deep/30"}`}>
                {step.hint}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
