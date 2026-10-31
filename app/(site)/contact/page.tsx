import { ContactChannelGrid } from "@/components/contact/contact-icons";
import { ContactForm } from "@/components/contact/contact-form";
import { site, whatsappHref } from "@/lib/site";

export const metadata = {
  title: "Contact The Vitamin Spot",
  description: `Visit, call, or write to The Vitamin Spot in Abuja. ${site.address.label}. WhatsApp, email, and walk-ins welcome.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main className="mx-auto grid max-w-6xl items-start gap-12 px-5 py-16 md:px-8 md:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:gap-16">
      <div>
        <p className="text-[11px] tracking-[0.22em] text-deep/45 uppercase">Contact</p>
        <h1 className="font-display mt-3 text-5xl leading-[0.95] text-deep md:text-6xl">
          Come by, or write.
        </h1>
        <p className="mt-4 max-w-md text-sm leading-7 text-deep/70 md:text-base">
          Walk in, or send a note. If you want a chair waiting, message us first.
        </p>

        <div className="mt-8 max-w-md border-l border-deep/15 pl-4">
          <p className="text-[10px] font-medium tracking-[0.2em] text-deep/40 uppercase">Visit</p>
          <a
            href={site.address.mapUrl}
            className="mt-2 block text-sm leading-relaxed text-deep transition hover:text-deep/70"
          >
            {site.address.full}
          </a>
        </div>

        <ContactChannelGrid includeCall className="mt-10" />

        <a
          href={whatsappHref("Hello The Vitamin Spot.", site.whatsappUs)}
          className="mt-6 inline-flex items-center gap-2 text-sm text-deep/50 transition hover:text-deep"
        >
          <span className="text-[10px] tracking-[0.18em] uppercase">US line</span>
          <span aria-hidden>·</span>
          +1 312 998-0147
        </a>
      </div>
      <ContactForm />
    </main>
  );
}
