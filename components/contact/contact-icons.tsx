import { site, whatsappHref } from "@/lib/site";

type Tone = "onDark" | "onLight";

const tones = {
  onDark: {
    link: "border-cream/20 text-cream/75 hover:border-cream/50 hover:bg-cream hover:text-deep",
    label: "text-cream/45",
    detail: "text-cream/50 group-hover:text-deep/55",
  },
  onLight: {
    link: "border-deep/12 text-deep hover:border-deep/35 hover:bg-deep hover:text-cream",
    label: "text-deep/45",
    detail: "text-deep/50 group-hover:text-cream/70",
  },
} as const;

function WhatsAppGlyph({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.96.52 3.8 1.44 5.42L2 22l4.92-1.55a10 10 0 0 0 5.12 1.4h.01c5.46 0 9.89-4.4 9.89-9.83C21.94 6.4 17.5 2 12.04 2Zm5.77 13.9c-.24.68-1.4 1.25-1.93 1.33-.5.07-1.13.1-1.82-.11-.42-.13-.96-.31-1.65-.61-2.9-1.26-4.79-4.18-4.94-4.37-.14-.2-1.18-1.57-1.18-3 0-1.42.74-2.12 1-2.41.26-.29.57-.36.76-.36h.55c.18 0 .42-.07.65.5.24.58.81 2 .88 2.14.07.15.12.32.02.51-.1.2-.15.32-.3.5-.14.17-.3.38-.43.51-.14.14-.29.29-.12.57.16.28.73 1.2 1.57 1.95 1.08.96 1.99 1.26 2.27 1.4.28.15.44.12.6-.07.17-.2.7-.81.89-1.09.18-.28.37-.23.62-.14.26.1 1.64.77 1.92.91.28.15.47.21.54.33.07.12.07.7-.17 1.38Z" />
    </svg>
  );
}

function InstagramGlyph({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor">
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4" strokeWidth="1.5" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function MailGlyph({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor">
      <path strokeWidth="1.5" strokeLinejoin="round" d="M4 6.5h16v11H4v-11Z" />
      <path
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m4.5 7 7.5 6 7.5-6"
      />
    </svg>
  );
}

function PhoneGlyph({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor">
      <path
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.2 4.5h2.3l1.2 3.1-1.5 1.1a11.5 11.5 0 0 0 5.1 5.1l1.1-1.5 3.1 1.2v2.3c0 .7-.5 1.3-1.2 1.4A14.5 14.5 0 0 1 5.8 5.7c.1-.7.7-1.2 1.4-1.2Z"
      />
    </svg>
  );
}

const channels = [
  {
    key: "whatsapp",
    label: "WhatsApp",
    href: whatsappHref("Hi The Vitamin Spot."),
    external: true,
    Icon: WhatsAppGlyph,
    detail: site.phone,
  },
  {
    key: "instagram",
    label: "Instagram",
    href: site.instagram,
    external: true,
    Icon: InstagramGlyph,
    detail: site.instagramHandle,
  },
  {
    key: "email",
    label: "Email",
    href: `mailto:${site.email}`,
    external: false,
    Icon: MailGlyph,
    detail: site.email,
  },
  {
    key: "call",
    label: "Call",
    href: `tel:${site.phoneHref}`,
    external: false,
    Icon: PhoneGlyph,
    detail: site.phone,
  },
] as const;

/** Compact square icon row — footer / dense surfaces */
export function ContactIconRow({
  tone = "onDark",
  includeCall = false,
  className = "",
}: {
  tone?: Tone;
  includeCall?: boolean;
  className?: string;
}) {
  const t = tones[tone];
  const items = channels.filter((c) => includeCall || c.key !== "call");

  return (
    <ul className={`flex flex-wrap items-center gap-2 ${className}`.trim()}>
      {items.map(({ key, label, href, external, Icon }) => (
        <li key={key}>
          <a
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            aria-label={label}
            title={label}
            className={`inline-flex size-11 items-center justify-center rounded-xl border transition duration-200 ${t.link}`}
          >
            <Icon className="size-[1.05rem]" />
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Editorial directory list — contact page */
export function ContactChannelGrid({
  includeCall = true,
  className = "",
}: {
  tone?: Tone;
  includeCall?: boolean;
  className?: string;
}) {
  const items = channels.filter((c) => includeCall || c.key !== "call");

  return (
    <ul className={`divide-y divide-deep/10 border-y border-deep/10 ${className}`.trim()}>
      {items.map(({ key, label, href, external, Icon, detail }) => (
        <li key={key}>
          <a
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            className="group flex items-center gap-4 py-5 transition sm:gap-5"
          >
            <span className="grid size-10 shrink-0 place-items-center text-deep/55 transition group-hover:text-deep">
              <Icon className="size-[1.15rem]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-medium tracking-[0.22em] text-deep/40 uppercase">
                {label}
              </span>
              <span className="font-display mt-1.5 block truncate text-xl leading-none text-deep sm:text-2xl">
                {detail}
              </span>
            </span>
            <span
              className="shrink-0 text-sm text-deep/25 transition group-hover:translate-x-0.5 group-hover:text-deep"
              aria-hidden
            >
              →
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
