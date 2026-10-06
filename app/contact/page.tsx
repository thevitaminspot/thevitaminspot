import { ContactForm } from "@/components/contact/contact-form";
import { site, whatsappHref } from "@/lib/site";

export const metadata = {
  title: "Contact The Vitamin Spot",
  description: `Visit, call, or write to The Vitamin Spot in Abuja. ${site.address.label}. WhatsApp, email, and walk-ins welcome.`,
  alternates: { canonical: "/contact" },
};

const channels = [
  {
    label: "WhatsApp",
    value: site.phone,
    href: whatsappHref("Hi The Vitamin Spot. I want to come by."),
    icon: "whatsapp",
  },
  {
    label: "WhatsApp US",
    value: "+1 312 998-0147",
    href: whatsappHref("Hello The Vitamin Spot.", site.whatsappUs),
    icon: "whatsapp",
  },
  {
    label: "Call",
    value: site.phone,
    href: `tel:${site.phoneHref}`,
    icon: "phone",
  },
  {
    label: "Email",
    value: site.email,
    href: `mailto:${site.email}`,
    icon: "mail",
  },
  {
    label: "Instagram",
    value: site.instagramHandle,
    href: site.instagram,
    icon: "instagram",
  },
] as const;

export default function ContactPage() {
  return (
    <main className="mx-auto grid max-w-6xl items-start gap-12 px-5 py-16 md:px-8 md:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:gap-16">
      <div>
        <h1 className="font-display text-5xl leading-[0.95] text-deep md:text-6xl">
          Come by, or write.
        </h1>
        <p className="mt-4 max-w-md text-sm leading-7 text-deep/70 md:text-base">
          Walk in, or send a note. If you want a chair waiting, message us first.
        </p>
        <a
          href={site.address.mapUrl}
          className="mt-6 block max-w-md text-sm leading-relaxed text-deep underline decoration-deep/20"
        >
          {site.address.full}
        </a>
        <ul className="mt-10 space-y-5">
          {channels.map((channel) => (
            <li key={channel.label}>
              <a href={channel.href} className="flex items-center gap-3 text-sm">
                <ContactIcon name={channel.icon} />
                <span>
                  <span className="block text-deep/50">{channel.label}</span>
                  <span className="mt-0.5 block text-deep">{channel.value}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      <ContactForm />
    </main>
  );
}

function ContactIcon({ name }: { name: "whatsapp" | "phone" | "mail" | "instagram" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5 shrink-0 text-deep"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      {name === "whatsapp" ? (
        <>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.2a7.3 7.3 0 0 0-6.3 11L5 19.5l4.4-.9A7.3 7.3 0 1 0 12 4.2Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.3 10.4c.2 1.3 1.5 2.8 2.8 3.2.3.1.6 0 .9-.3l.4-.5c.1-.2.3-.2.5 0l1.1.5c.2.1.3.3.2.6-.2.5-.8.9-1.4.9-2.1 0-4.5-2.2-5-4.1-.2-.6.1-1.2.6-1.5l.6-.4c.2-.1.3-.1.4.1l.5.8c.1.2 0 .3 0 .5Z"
          />
        </>
      ) : null}
      {name === "phone" ? (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.2 5.4h2l1 3-1.4 1a10.6 10.6 0 0 0 4.8 4.8l1-1.4 3 1v2A1.6 1.6 0 0 1 17 17 12.6 12.6 0 0 1 7 7a1.6 1.6 0 0 1 1.2-1.6Z"
        />
      ) : null}
      {name === "mail" ? (
        <>
          <rect x="4" y="6" width="16" height="12" rx="1.5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="m5 7 7 6 7-6" />
        </>
      ) : null}
      {name === "instagram" ? (
        <>
          <rect x="4.5" y="4.5" width="15" height="15" rx="4" />
          <circle cx="12" cy="12" r="3.2" />
          <circle cx="16.6" cy="7.4" r="0.6" fill="currentColor" stroke="none" />
        </>
      ) : null}
    </svg>
  );
}
