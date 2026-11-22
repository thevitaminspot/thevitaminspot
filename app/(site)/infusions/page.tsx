import Image from "next/image";
import { Suspense } from "react";
import { InfusionBooking } from "@/components/infusions/infusion-booking";
import { pageShell, surfaceCard } from "@/components/ui/layout-styles";
import { listInfusions } from "@/lib/data";
import { site, whatsappHref } from "@/lib/site";

export const metadata = {
  title: "Book an IV drip in Abuja",
  description:
    "Book an IV drip at The Vitamin Spot in Abuja. Energy, Glow, Hydration, Immunity, Myers, and Recovery. Walk in or pick a time online.",
  alternates: { canonical: "/infusions" },
};

export default async function InfusionsPage() {
  const drips = await listInfusions();

  return (
    <main className={pageShell}>
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start lg:gap-12">
          <div className="min-w-0 lg:sticky lg:top-24 lg:col-span-5">
            <header>
              <p className="text-[11px] font-medium tracking-[0.22em] text-deep/60 uppercase">
                The Lounge · Abuja
              </p>
              <h1 className="mt-2 font-display text-4xl text-deep sm:text-5xl">Book an IV drip</h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-deep/70">
                Pick your drip, choose a time, and reserve your chair online. Most sessions take
                about an hour.
              </p>
            </header>

            <figure className="mt-6">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-deep/10 bg-deep/5 sm:aspect-[16/10] lg:aspect-[4/5]">
                <Image
                  src="/images/lifestyle/lounge-booking.jpg"
                  alt="Sunlit private IV drip lounge chair at The Vitamin Spot in Abuja"
                  fill
                  preload
                  sizes="(min-width: 1024px) 420px, 100vw"
                  className="object-cover object-center"
                />
              </div>
              <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-deep/65">
                <span>Theodak Plaza, CBD · Walk-ins welcome</span>
                <span className="flex items-center gap-3">
                  <a
                    href={site.address.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-deep underline decoration-deep/25 underline-offset-4 transition hover:decoration-deep"
                  >
                    Directions
                  </a>
                  <a
                    href={whatsappHref("Hi The Vitamin Spot, I'd like help choosing an IV drip.")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-deep underline decoration-deep/25 underline-offset-4 transition hover:decoration-deep"
                  >
                    WhatsApp
                  </a>
                </span>
              </figcaption>
            </figure>
          </div>

          <div className="min-w-0 lg:col-span-7">
            <Suspense
              fallback={
                <div className={`${surfaceCard} py-12 text-center text-sm text-deep/60`}>
                  Loading booking options…
                </div>
              }
            >
              <InfusionBooking drips={drips} />
            </Suspense>

            <p className="mt-5 text-xs leading-relaxed text-deep/60">
              Tell us if you’re pregnant, on medication, or have allergies. Wellness care only — not
              emergency treatment.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
