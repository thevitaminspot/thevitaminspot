import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarCheck, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { formatNaira } from "@/lib/money";
import type { CatalogInfusion, CatalogProduct } from "@/lib/catalog";
import { site, whatsappHref } from "@/lib/site";

function packIndex(index: number) {
  return String(index + 1).padStart(2, "0");
}

export function ProductStories({ products }: { products: CatalogProduct[] }) {
  return (
    <section id="the-range" className="range-wash px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="max-w-xl">
              <p className="text-[11px] tracking-[0.22em] text-deep/65 uppercase">In the shop</p>
              <h2 className="font-display mt-3 text-4xl leading-[1.05] text-deep md:text-5xl lg:text-6xl">
                The packs.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-deep/70">
                Take-home formulas you can open tonight. Each one below is a complete pack — open it
                for how to take it.
              </p>
            </div>
            <Link
              href="/shop"
              className="shrink-0 text-xs font-medium tracking-[0.15em] text-deep/75 uppercase transition hover:text-deep focus-visible:outline focus-visible:outline-offset-4 focus-visible:outline-deep"
            >
              See all packs
            </Link>
          </div>
        </Reveal>
      </div>

      {products.length === 0 ? (
        <p className="mx-auto mt-10 max-w-6xl text-sm text-deep/60">
          Nothing listed yet. Check back soon.
        </p>
      ) : (
        <div className="mx-auto mt-16 max-w-6xl space-y-20 md:mt-20 md:space-y-28">
          {products.map((product, index) => {
            const image = product.images[0]?.url;
            const poster = product.images[1]?.url ?? image;
            const details = product.benefits.length > 0 ? product.benefits : product.ingredients;
            const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;

            return (
              <Reveal key={product.id} delay={(index % 4) * 80}>
                <article className="grid items-center gap-10 md:grid-cols-12 lg:gap-14">
                  <div className={`relative md:col-span-7 ${index % 2 ? "md:order-2" : ""}`}>
                    <div className="relative overflow-hidden rounded-2xl border border-deep/10 bg-tint/40">
                      {image ? (
                        <Image
                          src={image}
                          alt={product.images[0]?.alt || product.name}
                          width={1100}
                          height={800}
                          sizes="(min-width: 1024px) 58vw, (min-width: 768px) 70vw, 100vw"
                          className="aspect-[5/4] w-full object-cover"
                        />
                      ) : (
                        <div className="aspect-[5/4] w-full bg-tint/60" />
                      )}
                      {hasDiscount ? (
                        <div className="absolute top-4 left-4 rounded-full bg-deep px-3 py-1 text-[10px] font-medium tracking-wider text-cream uppercase">
                          On offer
                        </div>
                      ) : null}
                    </div>

                    {poster && poster !== image ? (
                      <div
                        className={`absolute -bottom-5 hidden w-36 overflow-hidden rounded-xl border-4 border-cream md:block ${
                          index % 2 ? "-left-6" : "-right-6"
                        }`}
                      >
                        <Image
                          src={poster}
                          alt=""
                          width={240}
                          height={300}
                          sizes="144px"
                          className="aspect-[3/4] w-full object-cover"
                        />
                      </div>
                    ) : null}
                  </div>

                  <div
                    className={`flex flex-col md:col-span-5 ${
                      index % 2 ? "md:order-1 md:pr-2 lg:pr-6" : "md:pl-2 lg:pl-6"
                    }`}
                  >
                    <p className="text-[11px] tracking-[0.22em] text-deep/65 uppercase">
                      Pack {packIndex(index)}
                    </p>

                    <h3 className="font-display mt-3 text-3xl leading-[1.05] text-deep md:text-4xl lg:text-[2.65rem]">
                      {product.name}
                    </h3>

                    <p className="mt-3 max-w-sm text-sm leading-relaxed text-deep/70">
                      {product.tagline}
                    </p>

                    {details.length > 0 ? (
                      <ul className="mt-8 max-w-sm space-y-4">
                        {details.slice(0, 3).map((detail) => {
                          const split = detail.indexOf(":");
                          const label =
                            split > 0 && split < 42 ? detail.slice(0, split).trim() : null;
                          const body = label ? detail.slice(split + 1).trim() : detail;

                          return (
                            <li key={detail} className="flex gap-3">
                              <span
                                className="mt-[0.55rem] size-1.5 shrink-0 rounded-full bg-sage/80"
                                aria-hidden
                              />
                              <span className="min-w-0 text-sm leading-relaxed text-deep/70">
                                {label ? (
                                  <>
                                    <span className="font-medium text-deep">{label}</span>
                                    {body ? (
                                      <span className="text-deep/60"> — {body}</span>
                                    ) : null}
                                  </>
                                ) : (
                                  body
                                )}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}

                    <div className="mt-9 flex flex-wrap items-end justify-between gap-4">
                      <div className="flex items-baseline gap-2.5">
                        <p className="font-display text-3xl tracking-tight text-deep">
                          {formatNaira(product.price)}
                        </p>
                        {hasDiscount ? (
                          <p className="text-sm text-deep/60 line-through">
                            {formatNaira(product.compareAtPrice!)}
                          </p>
                        ) : null}
                        <span className="text-[11px] tracking-[0.12em] text-deep/65 uppercase">
                          each
                        </span>
                      </div>
                      <Link
                        href={`/shop/${product.slug}`}
                        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-deep px-5 py-3.5 text-[11px] font-medium tracking-[0.16em] text-cream uppercase transition hover:bg-deep-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-deep"
                      >
                        See this pack
                      </Link>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function WalkIn({ drips = [] }: { drips?: CatalogInfusion[] }) {
  const featuredDrips = (
    drips.some((item) => item.featured) ? drips.filter((item) => item.featured) : drips
  ).slice(0, 4);

  return (
    <section className="hero-stage relative overflow-hidden px-5 py-20 text-cream md:px-8 md:py-28">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cream/15 to-transparent"
        aria-hidden
      />

      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-14">
        <Reveal className="min-w-0 lg:col-span-6">
          <p className="text-[11px] font-medium tracking-[0.22em] text-tint uppercase">
            The Lounge · {site.address.area}, {site.address.city}
          </p>
          <h2 className="font-display mt-3 text-4xl leading-[1.03] text-cream text-balance md:text-5xl lg:text-[3.5rem]">
            Come in for a drip.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-cream/80 text-pretty sm:text-base sm:leading-7">
            Settle into a chair for about an hour while a nurse runs your infusion. Walk in when it
            suits you, or reserve a slot online so everything is ready on arrival.
          </p>

          <ul className="mt-8 space-y-3.5 border-y border-cream/12 py-6 text-sm">
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-tint" strokeWidth={1.6} aria-hidden />
              <span className="text-cream/85">
                <a
                  href={site.address.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-cream/25 underline-offset-4 transition hover:text-tint hover:decoration-tint"
                >
                  {site.address.line1}
                </a>
                <span className="text-cream/65"> · {site.address.area}</span>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Clock className="mt-0.5 size-4 shrink-0 text-tint" strokeWidth={1.6} aria-hidden />
              <span className="text-cream/85">
                45–75 minutes <span className="text-cream/65">· Nurse-led in-chair session</span>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CalendarCheck
                className="mt-0.5 size-4 shrink-0 text-tint"
                strokeWidth={1.6}
                aria-hidden
              />
              <span className="text-cream/85">
                Walk-ins welcome <span className="text-cream/65">· Or book a set time online</span>
              </span>
            </li>
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/infusions" variant="cream" className="min-h-11 sm:min-h-12">
              Book a Drip
            </Button>
            <a
              href={whatsappHref("Hi The Vitamin Spot. I want to come in for a drip.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-cream/35 px-6 py-3 text-[11px] font-medium tracking-[0.16em] text-cream uppercase transition hover:bg-cream hover:text-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cream sm:min-h-12"
            >
              WhatsApp Us
            </a>
          </div>
        </Reveal>

        <Reveal delay={90} className="min-w-0 lg:col-span-6">
          <div className="overflow-hidden rounded-2xl border border-cream/15 bg-white/[0.04] backdrop-blur-sm">
            <div className="flex items-center justify-between gap-4 border-b border-cream/10 px-5 py-4 sm:px-6">
              <p className="text-[11px] font-medium tracking-[0.2em] text-tint uppercase">
                In-Lounge IV Menu
              </p>
              <Link
                href="/infusions"
                className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-medium tracking-[0.14em] text-cream/80 uppercase transition hover:text-tint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cream"
              >
                See all {drips.length > 0 ? drips.length : ""}
                <ArrowRight className="size-3.5" strokeWidth={1.6} aria-hidden />
              </Link>
            </div>

            {featuredDrips.length > 0 ? (
              <ul className="divide-y divide-cream/10">
                {featuredDrips.map((drip) => (
                  <li key={drip.id}>
                    <Link
                      href={`/infusions?drip=${drip.slug}`}
                      className="group flex items-center justify-between gap-3 px-4 py-4 transition hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-cream sm:gap-4 sm:px-6 sm:py-5"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-display text-xl leading-none text-cream sm:text-2xl">
                            {drip.name}
                          </span>
                          <span className="rounded-full border border-cream/15 bg-cream/[0.06] px-2.5 py-0.5 text-[10px] font-medium tracking-[0.1em] text-cream/75 uppercase">
                            {drip.durationMin} min
                          </span>
                        </div>
                        <p className="mt-1.5 truncate text-xs leading-relaxed text-cream/70 sm:text-sm">
                          {drip.tagline}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                        <span className="text-sm font-medium tabular-nums text-tint sm:text-base">
                          {formatNaira(drip.price)}
                        </span>
                        <ArrowRight
                          className="size-4 text-cream/50 transition group-hover:translate-x-0.5 group-hover:text-cream"
                          strokeWidth={1.5}
                          aria-hidden
                        />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-6 py-8 text-sm text-cream/75">
                Walk in or message us on WhatsApp for today&apos;s infusion menu.
              </div>
            )}

            <div className="border-t border-cream/10 bg-cream/[0.03] px-5 py-3.5 text-xs text-cream/70 sm:px-6">
              Online reservations hold your chair with a booking fee applied toward your session.
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
