import Link from "next/link";
import { PolicySection, PolicyShell } from "@/components/legal/policy-shell";
import { site } from "@/lib/site";

export const metadata = {
  title: "Terms",
  description: `Terms of use for shopping and booking with ${site.name}.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <PolicyShell
      title="Terms"
      intro={`These terms cover shopping, pickup, delivery, and IV bookings with ${site.name}.`}
    >
      <PolicySection title="Who we are">
        <p>
          {site.legalName} operates this website and shop at {site.address.full}. Contact:{" "}
          <a href={`mailto:${site.email}`} className="text-deep underline decoration-deep/20">
            {site.email}
          </a>{" "}
          · {site.phone}.
        </p>
      </PolicySection>

      <PolicySection title="Using this site">
        <p>
          You may browse, place orders, and request IV appointments for personal use. Do not misuse
          the site, attempt unauthorised access, or use our content commercially without permission.
        </p>
      </PolicySection>

      <PolicySection title="Orders & payment">
        <p>
          Prices are in Nigerian Naira (₦). An order is accepted after successful Paystack payment.
          We may refuse or cancel an order if stock is unavailable, payment fails, or we cannot fulfil
          delivery to your area — in those cases we will contact you and arrange a refund or
          alternative where appropriate.
        </p>
        <p>
          Delivery fees, pickup, and timing are described in our{" "}
          <Link href="/shipping" className="text-deep underline decoration-deep/20">
            shipping policy
          </Link>
          . Returns and refunds are covered separately in{" "}
          <Link href="/refunds" className="text-deep underline decoration-deep/20">
            returns & refunds
          </Link>
          .
        </p>
      </PolicySection>

      <PolicySection title="IV infusions & bookings">
        <p>
          Infusion bookings require an online booking fee to hold your slot. Your appointment is
          confirmed after that fee is paid successfully. Cancellations are not free; the booking fee
          is non-refundable. Full detail is in{" "}
          <Link href="/refunds#booking" className="text-deep underline decoration-deep/20">
            returns & refunds
          </Link>
          .
        </p>
        <p>
          Infusions are wellness services offered at our lounge. They are not a substitute for
          emergency care or personalised medical advice from your physician. Tell us about relevant
          health conditions, allergies, or medications before your session. We may decline or stop a
          session if it would be unsafe.
        </p>
      </PolicySection>

      <PolicySection title="Products & health information">
        <p>
          Pack descriptions, benefits, and usage notes are general information about the products we
          sell. They are not medical diagnoses or treatment advice. Follow the label, and speak with
          a qualified clinician if you are pregnant, nursing, on medication, or unsure whether a
          product is right for you.
        </p>
      </PolicySection>

      <PolicySection title="Accounts">
        <p>
          If you create an account, keep your sign-in details secure. Order and booking history in
          your account is for your convenience; guest checkout and magic-link order pages remain
          available where offered.
        </p>
      </PolicySection>

      <PolicySection title="Liability">
        <p>
          We take care with fulfilment and lounge services. To the fullest extent allowed by Nigerian
          law, we are not liable for indirect or consequential loss, or for results that follow misuse
          of products, failure to follow usage guidance, or undisclosed health information. Nothing
          in these terms excludes liability that cannot be limited by law.
        </p>
      </PolicySection>

      <PolicySection title="Changes">
        <p>
          We may update these terms from time to time. The “Last updated” date at the top of this
          page will change when we do. Continued use of the site after an update means you accept the
          revised terms.
        </p>
      </PolicySection>

      <p className="mt-12 text-sm text-deep/60">
        Questions?{" "}
        <Link href="/contact" className="text-deep underline decoration-deep/20">
          Contact us
        </Link>
        .
      </p>
    </PolicyShell>
  );
}
