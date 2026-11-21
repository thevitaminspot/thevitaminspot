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
    <section className="hero-stage flex h-[calc(100dvh-var(--site-header-height))] min-h-[calc(100dvh-var(--site-header-height))] max-h-[calc(100dvh-var(--site-header-height))] flex-col overflow-hidden text-cream 2xl:h-auto 2xl:min-h-0 2xl:max-h-none 2xl:overflow-visible">
      <div className="mx-auto grid min-h-0 w-full max-w-6xl flex-1 grid-rows-[auto_minmax(0,1fr)] items-center gap-x-10 gap-y-[clamp(0.5rem,1.4vh,1.25rem)] px-5 py-[clamp(0.65rem,1.8vh,2rem)] md:px-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:grid-rows-1 lg:items-stretch">
        <div className="min-w-0 max-w-2xl self-center">
          <h1 className="animate-hero-in font-display text-[clamp(2.55rem,5.6vw,4.75rem)] leading-[0.98] tracking-[-0.025em]">
            Wellness, served beautifully.
          </h1>
          <p className="animate-hero-in hero-delay-1 font-display mt-4 text-[clamp(1.2rem,2.7vw,2.1rem)] leading-snug text-tint">
            Take it home, or settle in for the hour.
          </p>
          <div className="animate-hero-in hero-delay-2 mt-8 flex flex-wrap gap-3">
            <Button href="/shop" variant="cream" className="min-h-11 sm:min-h-12">
              Shop the Collection
            </Button>
            <Link
              href="/infusions"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-cream/30 px-5 py-3 text-[11px] font-medium tracking-[0.16em] text-cream uppercase transition hover:bg-cream hover:text-deep focus-visible:outline focus-visible:outline-offset-4 focus-visible:outline-cream sm:min-h-12 sm:px-6 sm:py-3.5"
            >
              Reserve an Infusion
            </Link>
          </div>
        </div>

        <div className="animate-hero-in hero-delay-2 relative flex min-h-0 w-full items-center justify-center self-stretch lg:justify-end">
          {/* Height-first: arch never exceeds the media slot, so the strip cannot clip it. */}
          <div className="relative mx-auto aspect-[3/4] h-full max-h-full w-auto max-w-full lg:mx-0 lg:max-h-[min(100%,28rem)] xl:max-h-[min(100%,30rem)] 2xl:h-[28rem] 2xl:max-h-[28rem]">
            <div className="hero-arch absolute inset-0 overflow-hidden border border-cream/15 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
              <Image
                src="/images/lifestyle/table-02.jpg"
                alt="Vitamin packs arranged on a table in soft light"
                fill
                priority
                className="object-cover object-[center_58%]"
                sizes="(min-width: 1024px) 420px, 85vw"
              />
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-deep/65 to-transparent sm:h-24" />
            </div>
            {lead?.image ? (
              <Link
                href={lead.href}
                className="animate-hero-in hero-delay-4 absolute bottom-0 left-0 z-10 flex w-[min(100%,13rem)] items-center gap-2 rounded-2xl border border-cream/20 bg-cream p-1.5 text-deep shadow-[0_10px_24px_rgba(0,0,0,0.18)] focus-visible:outline focus-visible:outline-offset-4 focus-visible:outline-cream sm:-left-4 sm:w-[14rem] sm:gap-2.5 sm:p-2"
              >
                <Image
                  src={lead.image}
                  alt={lead.name}
                  width={72}
                  height={72}
                  sizes="48px"
                  className="size-11 shrink-0 rounded-xl object-cover sm:size-14"
                />
                <span className="min-w-0 pr-1">
                  <span className="block truncate text-xs leading-4 sm:text-sm sm:leading-5">
                    {lead.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-deep/55 sm:text-sm">
                    {lead.price}
                  </span>
                </span>
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {packs.length > 0 ? (
        <div className="animate-hero-in hero-delay-5 shrink-0 border-t border-cream/10">
          <ul className="mx-auto flex max-w-6xl gap-0 overflow-x-auto sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
            {packs.slice(0, 3).map((pack) => (
              <li
                key={pack.href}
                className="min-w-[78%] border-cream/10 sm:min-w-0 sm:border-l first:sm:border-l-0"
              >
                <Link
                  href={pack.href}
                  className="flex min-h-11 items-center gap-3 px-5 py-[clamp(0.55rem,1.2vh,0.9rem)] transition hover:bg-white/5 focus-visible:outline focus-visible:outline-offset-4 focus-visible:outline-cream sm:gap-4 md:px-8"
                >
                  {pack.image ? (
                    <Image
                      src={pack.image}
                      alt={pack.name}
                      width={64}
                      height={64}
                      sizes="40px"
                      className="size-10 rounded-xl object-cover sm:size-11"
                    />
                  ) : (
                    <span className="size-10 rounded-xl bg-cream/10 sm:size-11" />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-cream">{pack.name}</span>
                    <span className="mt-0.5 block text-[11px] tracking-[0.12em] text-cream/50 uppercase">
                      {pack.price}
                    </span>
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
