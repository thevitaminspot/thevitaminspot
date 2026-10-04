"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { subscribeNotes } from "@/actions/contact";
import { brand } from "@/lib/brand";
import { site, whatsappHref } from "@/lib/site";

const links = [
  { href: "/shop", label: "Shop" },
  { href: "/infusions", label: "Infusions" },
  { href: "/contact", label: "Contact" },
];

const outline =
  "[filter:drop-shadow(1px_0_0_#fff)_drop-shadow(-1px_0_0_#fff)_drop-shadow(0_1px_0_#fff)_drop-shadow(0_-1px_0_#fff)]";

export function Footer({ packs }: { packs: { href: string; label: string }[] }) {
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);

  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="bg-deep text-cream">
      <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <Image
                src={brand.logo.src}
                alt={brand.logo.alt}
                width={36}
                height={47}
                className={`h-12 w-auto object-contain ${outline}`}
              />
              <p className="font-display text-3xl leading-none">{site.name}</p>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-7 text-cream/70">{site.tagline}</p>
            <p className="mt-4 text-sm text-cream/50">{site.address.city}</p>
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

        <div className="mt-14 flex flex-col gap-5 border-t border-cream/15 pt-6 md:flex-row md:items-end md:justify-between">
          <p className="text-xs text-cream/45">© 2026 The Vitamin Spot. All rights reserved.</p>
          <form
            className="w-full max-w-sm"
            onSubmit={async (event) => {
              event.preventDefault();
              setPending(true);
              setNote("");
              const result = await subscribeNotes(email);
              setPending(false);
              setNote(result.error ?? "Noted.");
              if (!result.error) setEmail("");
            }}
          >
            <div className="flex overflow-hidden rounded-lg border border-cream/20">
              <label className="sr-only" htmlFor="footer-email">
                Email address
              </label>
              <input
                id="footer-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email address"
                className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm text-cream outline-none placeholder:text-cream/40"
              />
              <button
                type="submit"
                disabled={pending}
                className="shrink-0 bg-cream px-4 py-2 text-sm text-deep disabled:opacity-60"
              >
                {pending ? "Sending" : "Subscribe"}
              </button>
            </div>
            {note ? <p className="mt-2 text-xs text-cream/60">{note}</p> : null}
          </form>
        </div>
      </div>
    </footer>
  );
}
