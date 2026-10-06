import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero({
  packs,
}: {
  packs: { href: string; name: string; price: string; image: string }[];
}) {
  const lead = packs[0];

  return (
    <section className="hero-stage text-cream">
      <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-5 py-12 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
        <div>
          <h1 className="font-display text-[4.6rem] leading-[0.8] sm:text-[6.5rem]">
            The packs.
          </h1>
          <p className="font-display mt-3 text-3xl text-tint sm:text-5xl">A chair for the drip.</p>
          <p className="mt-6 max-w-md text-base leading-7 text-cream/75">
            Supplements and vitamins you can take home, and IV sessions in the lounge. Shop the
            packs, or book the hour.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/shop" variant="cream">
              Shop the packs
            </Button>
            <Link
              href="/infusions"
              className="inline-flex items-center justify-center rounded-lg border border-cream/30 px-6 py-3.5 text-sm tracking-[0.1em] text-cream uppercase transition hover:bg-cream hover:text-deep"
            >
              Book an IV
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[460px] lg:max-w-none">
          <div className="relative h-[480px] overflow-hidden rounded-t-[200px] rounded-b-[1.75rem] border border-cream/15 shadow-[0_30px_80px_rgba(0,0,0,0.28)] sm:h-[560px]">
            <Image
              src="/images/lifestyle/table-02.jpg"
              alt="Cranberry, tomato yeast, and collagen open on a table"
              fill
              priority
              className="object-cover object-[center_60%]"
              sizes="(min-width: 1024px) 520px, 100vw"
            />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-deep/70 to-transparent" />
          </div>
          {lead?.image ? (
            <Link
              href={lead.href}
              className="absolute -bottom-2 -left-2 flex w-[210px] items-center gap-3 rounded-2xl border border-cream/20 bg-cream p-2 text-deep shadow-xl sm:-left-8"
            >
              <Image
                src={lead.image}
                alt=""
                width={72}
                height={72}
                className="size-16 shrink-0 rounded-xl object-cover"
              />
              <span>
                <span className="block text-sm leading-5">{lead.name}</span>
                <span className="mt-1 block text-sm text-deep/55">{lead.price}</span>
              </span>
            </Link>
          ) : null}
        </div>
      </div>

      {packs.length > 0 ? (
        <div className="border-t border-cream/10">
          <ul className="mx-auto grid max-w-[1200px] sm:grid-cols-2 lg:grid-cols-3">
            {packs.slice(0, 3).map((pack) => (
              <li key={pack.href} className="border-cream/10 sm:border-l first:sm:border-l-0">
                <Link href={pack.href} className="flex items-center gap-4 px-5 py-4 transition hover:bg-white/5 md:px-8">
                  {pack.image ? (
                    <Image
                      src={pack.image}
                      alt=""
                      width={64}
                      height={64}
                      className="size-14 rounded-xl object-cover"
                    />
                  ) : (
                    <span className="size-14 rounded-xl bg-cream/10" />
                  )}
                  <span>
                    <span className="block text-sm text-cream">{pack.name}</span>
                    <span className="mt-1 block text-sm text-cream/55">{pack.price}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
