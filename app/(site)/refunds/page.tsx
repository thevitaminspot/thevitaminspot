import Link from "next/link";
import { PolicySection, PolicyShell } from "@/components/legal/policy-shell";
import {
  BOOKING_CANCELLATION_NOT_FREE,
  BOOKING_FEE_REQUIRED_MESSAGE,
} from "@/lib/booking-policy";
import { site } from "@/lib/site";

export const metadata = {
  title: "Returns & refunds",
  description: `Returns, shop refunds, and IV booking fee policy for ${site.name}.`,
  alternates: { canonical: "/refunds" },
};

export default function RefundsPage() {
  return (
    <PolicyShell
      title="Returns & refunds"
      intro={`When we replace or refund shop orders, and how IV booking fees work at ${site.name}.`}
    >
      <PolicySection title="Shop returns">
        <p>
          Unopened products in original, sellable condition may be returned within 7 days of
          delivery or pickup if you arrange the return with us first. Message{" "}
          <a href={`mailto:${site.email}`} className="text-deep underline decoration-deep/20">
            {site.email}
          </a>{" "}
          with your order number before sending anything back.
        </p>
        <p>
          Opened supplements, ampoules, vials, or products that are not in resale condition generally
          cannot be returned for hygiene and safety reasons.
        </p>
      </PolicySection>

      <PolicySection title="Faulty, damaged, or wrong items">
        <p>
          If an item is defective, damaged in transit, or not what you ordered, contact us within 48
          hours of receiving it. Include photos and your order number. We will offer a replacement or
          refund for confirmed issues caused by us or the carrier.
        </p>
      </PolicySection>

      <PolicySection title="How refunds are paid">
        <p>
          Approved shop refunds are processed through Paystack back to the original payment method
          where possible. Timing depends on your bank or card provider. Delivery fees are only
          refunded when the whole order is cancelled before dispatch or when the error is ours.
        </p>
      </PolicySection>

      <PolicySection id="booking" title="IV booking fees">
        <p>{BOOKING_FEE_REQUIRED_MESSAGE}</p>
        <p>{BOOKING_CANCELLATION_NOT_FREE}</p>
        <p>
          You can reschedule or cancel from the appointment link in your email where the site allows
          it. Cancelling does not return the booking fee. Any exception is only at our discretion and
          would be handled manually — the website does not auto-refund booking fees.
        </p>
        <p>
          The remaining balance for your infusion (if any) is due as we advise when you visit or as
          shown for that service.
        </p>
      </PolicySection>

      <PolicySection title="Order cancellations before dispatch">
        <p>
          If you need to cancel a paid shop order before it is packed or handed to a rider, contact
          us quickly. We will confirm whether cancellation and refund are still possible. Once an
          order is out for delivery or collected, the shop return rules above apply.
        </p>
      </PolicySection>

      <p className="mt-12 text-sm text-deep/60">
        Related:{" "}
        <Link href="/shipping" className="text-deep underline decoration-deep/20">
          Shipping & pickup
        </Link>{" "}
        ·{" "}
        <Link href="/terms" className="text-deep underline decoration-deep/20">
          Terms
        </Link>{" "}
        ·{" "}
        <Link href="/contact" className="text-deep underline decoration-deep/20">
          Contact
        </Link>
        .
      </p>
    </PolicyShell>
  );
}
