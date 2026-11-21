import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";
import { formatNaira } from "@/lib/money";
import type { CatalogProduct } from "@/lib/catalog";
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
              <p className="text-[11px] tracking-[0.22em] text-deep/45 uppercase">In the shop</p>
              <h2 className="font-display mt-3 text-4xl leading-[1.05] text-deep md:text-5xl lg:text-6xl">
                The packs.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-deep/65">
                Take-home formulas you can open tonight. Each one below is a complete pack — open it
                for how to take it.
              </p>
            </div>
            <Link
              href="/shop"
              className="shrink-0 text-xs font-medium tracking-[0.15em] text-deep/70 uppercase transition hover:text-deep"
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
                        <div className="absolute top-4 left-4 bg-deep px-3 py-1 text-[10px] font-medium tracking-wider text-cream uppercase">
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
                    <p className="text-[11px] tracking-[0.22em] text-deep/40 uppercase">
                      Pack {packIndex(index)}
                    </p>

                    <h3 className="font-display mt-3 text-3xl leading-[1.05] text-deep md:text-4xl lg:text-[2.65rem]">
                      {product.name}
                    </h3>

                    <p className="mt-3 max-w-sm text-sm leading-relaxed text-deep/60">
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
                          <p className="text-sm text-deep/35 line-through">
                            {formatNaira(product.compareAtPrice!)}
                          </p>
                        ) : null}
                        <span className="text-[11px] tracking-[0.12em] text-deep/45 uppercase">
                          each
                        </span>
                      </div>
                      <Link
                        href={`/shop/${product.slug}`}
                        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-deep px-5 py-3.5 text-[11px] font-medium tracking-[0.16em] text-cream uppercase transition hover:bg-[#14382a] focus-visible:outline focus-visible:outline-offset-4 focus-visible:outline-deep"
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

export function WalkIn() {
  return (
    <section className="px-5 py-16 md:px-8 md:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2 md:gap-16">
        <Reveal className="relative h-72 overflow-hidden bg-tint/40 md:aspect-[4/5] md:h-auto">
          <Image
            src="/images/lifestyle/table-01.jpg"
            alt="Vitamin packs open on a table"
            fill
            loading="lazy"
            className="object-cover"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
        </Reveal>
        <Reveal delay={100}>
          <p className="text-[11px] tracking-[0.22em] text-deep/45 uppercase">The lounge</p>
          <h2 className="font-display mt-3 text-4xl leading-[1.05] text-deep md:text-5xl lg:text-6xl">
            Come in for a drip.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-deep/70 md:text-base">
            You sit for about an hour while a nurse runs the drip. Walk in when it suits you, or
            send a WhatsApp if you want to know a chair is ready.
          </p>
          <dl className="mt-9 max-w-md border-t border-deep/12 text-sm">
            <div className="grid grid-cols-[7rem_1fr] gap-4 border-b border-deep/12 py-3.5">
              <dt className="text-[11px] tracking-[0.14em] text-deep/45 uppercase">Find us</dt>
              <dd className="text-deep/80">
                {site.address.line1}, {site.address.area}
              </dd>
            </div>
            <div className="grid grid-cols-[7rem_1fr] gap-4 border-b border-deep/12 py-3.5">
              <dt className="text-[11px] tracking-[0.14em] text-deep/45 uppercase">Plan for</dt>
              <dd className="text-deep/80">Roughly an hour in the chair</dd>
            </div>
            <div className="grid grid-cols-[7rem_1fr] gap-4 border-b border-deep/12 py-3.5">
              <dt className="text-[11px] tracking-[0.14em] text-deep/45 uppercase">Walk-in</dt>
              <dd className="text-deep/80">Fine. Book online if you want a set time</dd>
            </div>
          </dl>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/infusions"
              className="inline-flex items-center justify-center rounded-xl bg-deep px-6 py-3.5 text-[11px] font-medium tracking-[0.16em] text-cream uppercase transition hover:bg-[#14382a]"
            >
              Book a drip
            </Link>
            <a
              href={whatsappHref("Hi The Vitamin Spot. I want to come in for a drip.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl border border-deep/15 px-6 py-3.5 text-[11px] font-medium tracking-[0.16em] text-deep uppercase transition hover:bg-white"
            >
              WhatsApp us
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
