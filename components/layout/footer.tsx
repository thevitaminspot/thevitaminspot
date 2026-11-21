import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { BrandWordmark } from "@/components/brand/wordmark";
import { ContactIconRow } from "@/components/contact/contact-icons";
import { FooterTrackOrder } from "@/components/layout/footer-track-order";
import { brand } from "@/lib/brand";
import { site, whatsappHref } from "@/lib/site";

const explore = [
  { href: "/shop", label: "Shop packs" },
  { href: "/infusions", label: "IV drips" },
  { href: "/contact", label: "Contact" },
] as const;

const policies = [
  { href: "/terms", label: "Terms" },
  { href: "/shipping", label: "Shipping & pickup" },
  { href: "/refunds", label: "Returns & refunds" },
  { href: "/privacy", label: "Privacy & cookies" },
] as const;

const linkClass =
  "text-cream/80 transition hover:text-tint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cream";
const headingClass = "text-[11px] font-medium tracking-[0.18em] text-tint uppercase";

export function Footer() {
  return (
    <footer className="bg-deep text-cream">
      <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.45fr_0.85fr_1.15fr_0.95fr] lg:gap-12">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cream"
            >
              <Image
                src={brand.mark.src}
                alt=""
                width={40}
                height={40}
                sizes="40px"
                className="size-10 shrink-0 object-contain"
                aria-hidden
              />
              <BrandWordmark className="text-[1.65rem] leading-none text-cream sm:text-[1.85rem]" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/75">{site.tagline}</p>
            <ContactIconRow tone="onDark" className="mt-6" />
          </div>

          <div>
            <p className={headingClass}>Shop</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {explore.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
              <Suspense fallback={null}>
                <FooterTrackOrder />
              </Suspense>
            </ul>
          </div>

          <div>
            <p className={headingClass}>Visit &amp; Contact</p>
            <ul className="mt-4 space-y-2.5 text-sm text-cream/75">
              <li>
                <a
                  href={site.address.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  {site.address.line1}
                </a>
              </li>
              <li>
                {site.address.area}, {site.address.city}
              </li>
              <li>
                <a href={`tel:${site.phoneHref}`} className={linkClass}>
                  {site.phone}
                </a>
              </li>
              <li>
                <a
                  href={whatsappHref("Hello The Vitamin Spot", site.whatsappUs)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  WhatsApp US · +1 312 998-0147
                </a>
              </li>
              <li>
                <a href={`mailto:${site.email}`} className={`break-all ${linkClass}`}>
                  {site.email}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className={headingClass}>Policies</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {policies.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-cream/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-5 text-xs text-cream/65 sm:flex-row sm:items-center sm:justify-between md:px-8">
          <p>© 2026 {site.name}. All rights reserved.</p>
          <a
            href={site.developer.url}
            className="transition hover:text-cream"
            target="_blank"
            rel="noopener noreferrer"
          >
            Developed by {site.developer.name}
          </a>
        </div>
      </div>
    </footer>
  );
}
