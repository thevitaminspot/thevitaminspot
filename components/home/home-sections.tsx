import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";
import { formatNaira } from "@/lib/money";
import type { CatalogProduct } from "@/lib/catalog";
import { site, whatsappHref } from "@/lib/site";

export function ProductStories({ products }: { products: CatalogProduct[] }) {
  return (
    <section id="the-range" className="range-wash px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <h2 className="font-display max-w-2xl text-4xl leading-[1.05] text-deep md:text-5xl lg:text-6xl">
            The packs.
          </h2>
          <Link
            href="/shop"
            className="text-xs font-medium tracking-[0.15em] text-deep/70 uppercase transition hover:text-deep"
          >
            See all packs
          </Link>
        </div>
      </div>

      {products.length === 0 ? (
        <p className="mx-auto mt-10 max-w-6xl text-sm text-deep/60">
          Nothing listed yet. Check back soon.
        </p>
      ) : (
        <div className="mx-auto mt-14 max-w-6xl space-y-16 md:space-y-24">
          {products.map((product, index) => {
            const image = product.images[0]?.url;
            const poster = product.images[1]?.url ?? image;
            const details = product.benefits.length > 0 ? product.benefits : product.ingredients;
            const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;

            return (
              <Reveal key={product.id}>
                <article className="grid items-center gap-8 md:grid-cols-12 lg:gap-12">
                  <div className={`relative md:col-span-7 ${index % 2 ? "md:order-2" : ""}`}>
                    <div className="relative overflow-hidden rounded-2xl border border-deep/10 bg-tint/40 shadow-sm transition duration-500 hover:shadow-md">
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
                        className={`absolute -bottom-5 hidden w-36 overflow-hidden rounded-xl border-4 border-cream shadow-lg md:block ${
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

                  <div className={`md:col-span-5 ${index % 2 ? "md:order-1 md:pr-4" : "md:pl-4"}`}>
                    <h3 className="font-display text-3xl leading-tight text-deep md:text-4xl lg:text-[2.75rem]">
                      {product.name}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-deep/75">
                      {product.description || product.tagline}
                    </p>

                    {details.length > 0 ? (
                      <ul className="mt-5 space-y-2.5 text-xs leading-relaxed text-deep/70">
                        {details.slice(0, 4).map((detail) => (
                          <li key={detail}>{detail}</li>
                        ))}
                      </ul>
                    ) : null}

                    <div className="mt-6 flex items-baseline gap-3">
                      <p className="font-display text-3xl text-deep">{formatNaira(product.price)}</p>
                      {hasDiscount ? (
                        <p className="text-sm text-deep/40 line-through">
                          {formatNaira(product.compareAtPrice!)}
                        </p>
                      ) : null}
                      <span className="text-xs text-deep/50">each</span>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <Link
                        href={`/shop/${product.slug}`}
                        className="inline-flex items-center justify-center rounded-lg bg-deep px-5 py-3 text-[11px] font-medium tracking-[0.14em] text-cream uppercase transition hover:bg-[#14382a]"
                      >
                        See this pack
                      </Link>
                      <Link
                        href="/shop"
                        className="inline-flex items-center justify-center rounded-lg border border-deep/20 bg-transparent px-4 py-3 text-[11px] font-medium tracking-[0.14em] text-deep uppercase transition hover:bg-white"
                      >
                        See the shop
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
        <div className="relative h-72 overflow-hidden bg-tint/40 md:aspect-[4/5] md:h-auto">
          <Image
            src="/images/lifestyle/table-01.jpg"
            alt="Vitamin packs open on a table"
            fill
            loading="lazy"
            className="object-cover"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
        </div>
        <div>
          <h2 className="font-display text-4xl leading-[1.05] text-deep md:text-5xl lg:text-6xl">
            Come in for a drip.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-deep/75 md:text-base">
            You sit for about an hour while a nurse runs the drip. Walk in when it suits you, or
            send a WhatsApp if you want to know a chair is ready.
          </p>
          <dl className="mt-8 max-w-md border-t border-deep/15 text-sm">
            <div className="grid grid-cols-[6.5rem_1fr] gap-4 border-b border-deep/15 py-3">
              <dt className="text-deep/50">Find us</dt>
              <dd>{site.address.line1}, {site.address.area}</dd>
            </div>
            <div className="grid grid-cols-[6.5rem_1fr] gap-4 border-b border-deep/15 py-3">
              <dt className="text-deep/50">Plan for</dt>
              <dd>Roughly an hour in the chair</dd>
            </div>
            <div className="grid grid-cols-[6.5rem_1fr] gap-4 border-b border-deep/15 py-3">
              <dt className="text-deep/50">No booking?</dt>
              <dd>Fine. Book online if you want a set time</dd>
            </div>
          </dl>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/infusions"
              className="inline-flex items-center justify-center rounded-lg bg-deep px-6 py-3.5 text-xs font-medium tracking-[0.14em] text-cream uppercase transition hover:bg-[#14382a]"
            >
              Book a drip
            </Link>
            <a
              href={whatsappHref("Hi The Vitamin Spot. I want to come in for a drip.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-deep/20 px-6 py-3.5 text-xs font-medium tracking-[0.14em] text-deep uppercase transition hover:bg-white"
            >
              WhatsApp us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
