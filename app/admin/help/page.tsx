import Link from "next/link";
import {
  AdminPageHeader,
  AdminPanel,
  AdminQuickAction,
  AdminQuickActions,
} from "@/components/admin/ui";
import { site } from "@/lib/site";

export const metadata = { title: "Help" };
export const instant = false;

const sections = [
  {
    id: "start",
    title: "Getting started",
    href: "/admin",
    linkLabel: "Open Today",
    steps: [
      `Sign in with an admin email (listed in ADMIN_EMAIL, e.g. ${site.email}) or a Clerk user with role admin.`,
      "Use the left menu for daily work (Orders, Bookings, Products, Messages). Open Settings for Infusions, Hours, and Delivery.",
      "Today shows open orders, pending bookings, revenue, and low stock at a glance.",
      "If the shop tables are empty, use Load starter catalogue on Today, then review Products, Infusions, and Delivery before going live.",
    ],
  },
  {
    id: "products",
    title: "Add & edit products",
    href: "/admin/products",
    linkLabel: "Go to Products",
    steps: [
      "Open Products, then add or edit a pack.",
      "Set name, price in whole naira, stock, tagline, description, benefits, ingredients, and usage.",
      "Upload clear photos (up to the site limit). Featured packs appear first on the homepage and shop.",
      "Save — changes show on the public shop after save. Update stock when inventory changes.",
    ],
  },
  {
    id: "orders",
    title: "Orders & delivery",
    href: "/admin/orders",
    linkLabel: "Go to Orders",
    steps: [
      "Paid orders appear here after Paystack succeeds. Customer and admin both get email.",
      "Move status as you work: Paid → Packed → Out for delivery → Delivered (or pickup path). Cancelling can restore stock.",
      "Each status change can email the customer with a tracking link.",
      "Search by name, email, phone, or order number. Open an order for full address and payment detail.",
    ],
  },
  {
    id: "bookings",
    title: "IV bookings",
    href: "/admin/appointments",
    linkLabel: "Go to Bookings",
    steps: [
      "Customers pay a booking fee online; settlement usually moves the appointment to Confirmed.",
      "Accept pending bookings if needed, or cancel. Cancelling notifies the customer; the booking fee is non-refundable by site policy.",
      "Mark Completed after the session. Use Hours to set weekly open times and block or unblock dates.",
    ],
  },
  {
    id: "infusions",
    title: "Infusions",
    href: "/admin/infusions",
    linkLabel: "Go to Infusions",
    steps: [
      "Add or edit drip services: name, price, booking fee (deposit), duration, ingredients, and image.",
      "Hide a drip if you do not want new bookings for it. Delete only when there are no appointments, or the drip is hidden instead.",
    ],
  },
  {
    id: "hours",
    title: "Hours & blocked dates",
    href: "/admin/availability",
    linkLabel: "Go to Hours",
    steps: [
      "Edit each weekday: open/closed, start and end hour, slot length, and buffer. Save weekly hours.",
      "Block a date so no online slots appear that day. Use Unblock to open it again.",
      "Customers cannot book a slot starting within about one hour from now.",
    ],
  },
  {
    id: "delivery",
    title: "Delivery areas & fees",
    href: "/admin/zones",
    linkLabel: "Go to Delivery",
    steps: [
      "List Abuja areas you deliver to and set a fee (naira) for each.",
      "Checkout only offers active zones. Pickup at the lounge has no delivery fee.",
      "ETA text is shown with the area — keep it short (e.g. Abuja delivery).",
    ],
  },
  {
    id: "messages",
    title: "Messages & customers",
    href: "/admin/messages",
    linkLabel: "Go to Messages",
    steps: [
      "Messages holds contact-form submissions. Reply from email or WhatsApp — there is no reply box in admin.",
      "Customers (if listed in your menu) shows people from paid orders for follow-up.",
      "View shop in the sidebar opens the live storefront so you can check what customers see.",
    ],
  },
  {
    id: "payments",
    title: "Paystack & refunds",
    href: "/admin/orders",
    linkLabel: "Review orders",
    steps: [
      "Card, transfer, and USSD go through Paystack. Money settles to your Paystack business account, not the website.",
      "Admin does not refund money. To refund, open the transaction in the Paystack dashboard.",
      "Booking fees are non-refundable by policy unless you personally decide an exception in Paystack.",
      "If a customer paid after you cancelled, you get an admin alert — refund manually in Paystack if needed.",
    ],
  },
  {
    id: "emails",
    title: "Emails you will receive",
    href: "/admin/messages",
    linkLabel: "Open inbox",
    steps: [
      "New paid order → customer confirmation + admin alert.",
      "Order status changes → customer update.",
      "Booking confirmed / cancelled / deposit paid → customer (+ admin as configured).",
      "Contact form → admin email and Messages archive.",
      `From address is your Resend domain; replies often go to ${site.email}. Check spam if something is missing.`,
    ],
  },
] as const;

export default function AdminHelpPage() {
  return (
    <div>
      <AdminPageHeader
        eyebrow="Guide"
        title="Help"
        description="How to run the shop and lounge from this admin — products, orders, IV bookings, and settings."
      />

      <AdminQuickActions>
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="inline-flex items-center rounded-lg border border-deep/15 bg-white px-4 py-2 text-[11px] tracking-[0.14em] text-deep/70 uppercase transition hover:border-deep/35 hover:text-deep"
          >
            {section.title}
          </a>
        ))}
      </AdminQuickActions>

      <AdminPanel className="mb-8 px-5 py-4">
        <p className="text-sm leading-6 text-deep/65">
          Admin access is limited to emails in{" "}
          <code className="text-xs text-deep">ADMIN_EMAIL</code> (and Clerk users with role{" "}
          <code className="text-xs text-deep">admin</code>). Primary contact:{" "}
          <strong className="font-medium text-deep">{site.email}</strong>.
        </p>
      </AdminPanel>

      <div className="space-y-8">
        {sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className="scroll-mt-24 border-b border-deep/10 pb-8 last:border-b-0"
          >
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-display text-2xl text-deep">{section.title}</h2>
              <Link
                href={section.href}
                className="text-[11px] tracking-[0.12em] text-deep/55 uppercase transition hover:text-deep"
              >
                {section.linkLabel} →
              </Link>
            </div>
            <ol className="list-decimal space-y-2.5 pl-5 text-sm leading-6 text-deep/70">
              {section.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-2">
        <AdminQuickAction href="/admin/products">Add a product</AdminQuickAction>
        <AdminQuickAction href="/admin/orders">Review orders</AdminQuickAction>
        <AdminQuickAction href="/admin/appointments">Manage bookings</AdminQuickAction>
        <AdminQuickAction href="/admin">Back to Today</AdminQuickAction>
      </div>
    </div>
  );
}
