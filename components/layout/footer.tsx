import Image from "next/image";
import Link from "next/link";
import { brand } from "@/lib/brand";
import { site, whatsappHref } from "@/lib/site";

const links = [
  { href: "/shop", label: "Shop" },
  { href: "/infusions", label: "Infusions" },
  { href: "/contact", label: "Contact" },
];

export function Footer({ packs }: { packs: { href: string; label: string }[] }) {
  return (
    <footer className="bg-deep text-cream">
      <div className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <Image
                src={brand.mark.src}
                alt=""
                width={48}
                height={48}
                sizes="48px"
                className="size-12 shrink-0 object-contain"
                aria-hidden
              />
              <p className="font-display text-3xl leading-none">{site.name}</p>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-7 text-cream/70">{site.tagline}</p>
            <p className="mt-4 text-sm leading-relaxed text-cream/50">{site.address.label}</p>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-[11px] tracking-[0.13em] text-sage uppercase">Visit</p>
              <ul className="mt-5 space-y-3 text-sm">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-cream/85 hover:text-tint">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[11px] tracking-[0.13em] text-sage uppercase">Packs</p>
              <ul className="mt-5 space-y-3 text-sm">
                {packs.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-cream/85 hover:text-tint">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="md:col-start-2 md:row-start-1 lg:col-start-auto lg:row-start-auto">
            <p className="text-[11px] tracking-[0.13em] text-sage uppercase">Contact</p>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <a href={`tel:${site.phoneHref}`} className="hover:text-tint">
                  {site.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${site.email}`} className="break-all hover:text-tint">
                  {site.email}
                </a>
              </li>
              <li>
                <a href={whatsappHref()} className="hover:text-tint">
                  WhatsApp NG
                </a>
              </li>
              <li>
                <a href={whatsappHref("Hello The Vitamin Spot", site.whatsappUs)} className="hover:text-tint">
                  WhatsApp US · +1 312 998-0147
                </a>
              </li>
              <li>
                <a href={site.instagram} className="hover:text-tint">
                  {site.instagramHandle}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-cream/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-cream/45">© 2026 The Vitamin Spot. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            <Link href="/privacy" className="text-cream/55 hover:text-tint">
              Privacy & cookies
            </Link>
            <a
              href={site.developer.url}
              className="text-cream/55 hover:text-tint"
              target="_blank"
              rel="noopener noreferrer"
            >
              Developed by {site.developer.name}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
