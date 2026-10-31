import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { BrandWordmark } from "@/components/brand/wordmark";
import { FooterTrackOrder } from "@/components/layout/footer-track-order";
import { brand } from "@/lib/brand";
import { site, whatsappHref } from "@/lib/site";

const explore = [
  { href: "/shop", label: "Shop" },
  { href: "/infusions", label: "Infusions" },
  { href: "/contact", label: "Contact" },
] as const;

const policies = [
  { href: "/terms", label: "Terms" },
  { href: "/shipping", label: "Shipping & pickup" },
  { href: "/refunds", label: "Returns & refunds" },
  { href: "/privacy", label: "Privacy & cookies" },
] as const;

const linkClass = "text-cream/80 transition hover:text-tint";
const headingClass = "text-[11px] tracking-[0.16em] text-sage uppercase";

export function Footer() {
  return (
    <footer className="bg-deep text-cream">
      <div className="mx-auto max-w-6xl px-5 pt-14 pb-10 md:px-8 md:pt-16 md:pb-12">
        <div className="flex flex-col gap-8 border-b border-cream/12 pb-12 md:flex-row md:items-end md:justify-between md:gap-12">
          <div className="max-w-md">
            <div className="flex items-center gap-3">
              <Image
                src={brand.mark.src}
                alt=""
                width={44}
                height={44}
                sizes="44px"
                className="size-11 shrink-0 object-contain"
                aria-hidden
              />
              <BrandWordmark className="text-[1.85rem] leading-none text-cream sm:text-[2.15rem]" />
            </div>
            <p className="mt-5 text-sm leading-7 text-cream/65">{site.tagline}</p>
            <p className="mt-3 text-sm leading-relaxed text-cream/45">{site.address.label}</p>
          </div>

          <Link
            href="/shop"
            className="inline-flex w-fit items-center justify-center rounded-xl border border-cream/25 px-5 py-3 text-[11px] font-medium tracking-[0.16em] text-cream uppercase transition hover:border-cream/50 hover:bg-cream/5"
          >
            Shop packs
          </Link>
        </div>

        <div className="mt-12 grid gap-10 sm:grid-cols-3">
          <div>
            <p className={headingClass}>Explore</p>
            <ul className="mt-5 space-y-3 text-sm">
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
            <p className={headingClass}>Contact</p>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <a href={`tel:${site.phoneHref}`} className={linkClass}>
                  {site.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${site.email}`} className={`break-all ${linkClass}`}>
                  {site.email}
                </a>
              </li>
              <li>
                <a href={whatsappHref()} className={linkClass}>
                  WhatsApp NG
                </a>
              </li>
              <li>
                <a
                  href={whatsappHref("Hello The Vitamin Spot", site.whatsappUs)}
                  className={linkClass}
                >
                  WhatsApp US
                </a>
              </li>
              <li>
                <a
                  href={site.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  {site.instagramHandle}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className={headingClass}>Policies</p>
            <ul className="mt-5 space-y-3 text-sm">
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
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-5 text-xs text-cream/40 sm:flex-row sm:items-center sm:justify-between md:px-8">
          <p>© 2026 {site.name}. All rights reserved.</p>
          <a
            href={site.developer.url}
            className="transition hover:text-cream/70"
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
