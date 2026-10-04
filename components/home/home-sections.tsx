"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import type { CatalogProduct } from "@/lib/catalog";

function nairaLabel(kobo: number) {
  const amount = Math.round(kobo / 100).toString();
  return `₦${amount.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export function ProductStories({ products }: { products: CatalogProduct[] }) {
  return (
    <section id="the-range" className="range-wash px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display max-w-2xl text-5xl leading-[0.95] text-deep md:text-6xl">
          The packs.
        </h2>
      </div>

      {products.length === 0 ? (
        <p className="mx-auto mt-10 max-w-6xl text-sm text-deep/60">Nothing is featured right now.</p>
      ) : (
        <div className="mx-auto mt-16 max-w-6xl space-y-16">
          {products.map((product, index) => {
            const image = product.images[0]?.url;
            const poster = product.images[1]?.url ?? image;
            const details = product.benefits.length > 0 ? product.benefits : product.ingredients;
            return (
              <Reveal key={product.id}>
                <article className="grid items-center gap-6 md:grid-cols-12">
                  <div className={`relative md:col-span-7 ${index % 2 ? "md:order-2" : ""}`}>
                    <div className="overflow-hidden rounded-xl border border-deep/10 bg-tint">
                      {image ? (
                        <Image
                          src={image}
                          alt={product.images[0]?.alt || product.name}
                          width={1100}
                          height={800}
                          className="aspect-[5/4] w-full object-cover"
                        />
                      ) : (
                        <div className="aspect-[5/4] w-full" />
                      )}
                    </div>
                    {poster ? (
                      <Image
                        src={poster}
                        alt=""
                        width={220}
                        height={280}
                        className={`absolute -bottom-4 hidden w-32 rounded-lg border-4 border-cream object-cover md:block ${
                          index % 2 ? "-left-6" : "-right-6"
                        }`}
                      />
                    ) : null}
                  </div>
                  <div className={`md:col-span-5 ${index % 2 ? "md:order-1 md:pr-6" : "md:pl-6"}`}>
                    <h3 className="font-display text-4xl leading-none text-deep md:text-5xl">
                      {product.name}
                    </h3>
                    <p className="mt-4 max-w-sm text-sm leading-7 text-deep/75">
                      {product.description || product.tagline}
                    </p>
                    {details.length > 0 ? (
                      <ul className="mt-5 space-y-2 text-sm leading-6 text-deep/70">
                        {details.map((detail) => (
                          <li key={detail} className="flex gap-3">
                            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-sage" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <p className="font-display mt-5 text-3xl text-deep">{nairaLabel(product.price)}</p>
                    <div className="mt-6">
                      <Button href={`/shop/${product.slug}`}>See it</Button>
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
    <section className="px-5 py-16 md:px-8">
      <div className="panel mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-6 bg-white px-6 py-10 md:flex-row md:items-center md:px-10">
        <div>
          <h2 className="font-display text-5xl leading-[0.95] text-deep md:text-6xl">Book an IV.</h2>
          <p className="mt-4 max-w-md text-sm leading-7 text-deep/70">
            We’re in Abuja. Pick a time, or just walk in.
          </p>
        </div>
        <Button href="/infusions">Book</Button>
      </div>
    </section>
  );
}

const faqs = [
  {
    question: "How do I order?",
    answer: "Add it to your bag and check out. Or WhatsApp us.",
  },
  {
    question: "Do you do IVs?",
    answer: "Yes, in Abuja. Book a time, or walk in.",
  },
  {
    question: "How does delivery work?",
    answer: "Depends where you are. Ask us and we’ll tell you.",
  },
  {
    question: "How do I take them?",
    answer: "It’s on the pack. Message us if you want a hand.",
  },
];

export function Faq() {
  return (
    <section className="px-5 py-20 md:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display text-5xl text-deep md:text-6xl">Questions.</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {faqs.map((faq) => (
            <div key={faq.question} className="panel bg-white p-6">
              <p className="font-display text-2xl text-deep">{faq.question}</p>
              <p className="mt-4 text-sm leading-7 text-deep/70">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
