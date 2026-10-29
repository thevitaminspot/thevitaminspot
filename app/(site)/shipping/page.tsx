import Link from "next/link";
import { PolicySection, PolicyShell } from "@/components/legal/policy-shell";
import { site } from "@/lib/site";

export const metadata = {
  title: "Shipping & pickup",
  description: `Abuja delivery areas, fees, and shop pickup for ${site.name}.`,
  alternates: { canonical: "/shipping" },
};

export default function ShippingPage() {
  return (
    <PolicyShell
      title="Shipping & pickup"
      intro={`How ${site.name} delivers vitamin packs in Abuja, and how lounge pickup works.`}
    >
      <PolicySection title="Where we deliver">
        <p>
          We deliver within Abuja and nearby areas listed at checkout. Choose your area to see the
          delivery fee for that zone. Fees typically range from a few thousand naira depending on
          distance from our lounge in the Central Business District.
        </p>
        <p>
          We do not currently offer courier shipping outside the areas shown in checkout. If your
          location is missing,{" "}
          <Link href="/contact" className="text-deep underline decoration-deep/20">
            message us
          </Link>{" "}
          or use shop pickup.
        </p>
      </PolicySection>

      <PolicySection title="Timing">
        <p>
          Same-day delivery in Abuja is often possible when you order early and we have stock ready.
          Exact timing depends on your zone, traffic, and order volume. After payment you receive an
          order link so you can follow packing and delivery status.
        </p>
        <p>
          If we expect a delay, we will contact you using the phone or email on your order.
        </p>
      </PolicySection>

      <PolicySection title="Shop pickup">
        <p>
          You can choose lounge pickup at checkout at no delivery fee. Collect from {site.address.full}.
          We will mark the order ready when it is packed. Bring a form of ID matching the order name
          if we ask, and the order confirmation on your phone.
        </p>
        <p>
          Hours are walk-in friendly; message ahead on WhatsApp if you want to confirm we are free
          to hand over your pack.
        </p>
      </PolicySection>

      <PolicySection title="Failed delivery">
        <p>
          Please keep your phone on for the rider. If we cannot reach you or complete delivery after
          reasonable attempts, we may return the order to the lounge for pickup, or rearrange
          delivery (extra fees may apply for a new drop).
        </p>
      </PolicySection>

      <PolicySection title="Damaged or wrong items">
        <p>
          If something arrives damaged or incorrect, contact us within 48 hours with clear photos and
          your order number. We will arrange a replacement or refund where the issue is on our side.
          See also{" "}
          <Link href="/refunds" className="text-deep underline decoration-deep/20">
            returns & refunds
          </Link>
          .
        </p>
      </PolicySection>

      <PolicySection title="IV appointments">
        <p>
          Infusion bookings are not physical shipments. Attend at the lounge on your booked time, or
          manage the appointment from the link in your confirmation email.
        </p>
      </PolicySection>

      <p className="mt-12 text-sm text-deep/60">
        Need help with an order?{" "}
        <a href={`mailto:${site.email}`} className="text-deep underline decoration-deep/20">
          {site.email}
        </a>{" "}
        · {site.phone}.
      </p>
    </PolicyShell>
  );
}
