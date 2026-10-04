import { ContactForm } from "@/components/contact/contact-form";
import { site, whatsappHref } from "@/lib/site";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <main className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-2 md:px-8">
      <div>
        <h1 className="font-display text-5xl">Hello.</h1>
        <p className="mt-6 leading-8 text-deep/70">
          {site.address.city}, {site.address.country}
          <br />
          {site.phone}
          <br />
          {site.email}
        </p>
        <a href={whatsappHref()} className="mt-6 inline-block text-[11px] tracking-[0.2em] uppercase underline">
          WhatsApp
        </a>
        <iframe
          title="Map of The Vitamin Spot"
          src={site.address.embedUrl}
          className="mt-8 h-64 w-full rounded-xl grayscale"
        />
      </div>
      <ContactForm />
    </main>
  );
}
