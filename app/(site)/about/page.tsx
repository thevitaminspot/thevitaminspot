import Image from "next/image";
import { Button } from "@/components/ui/button";
import { blockGap, pageShell, pageWide } from "@/components/ui/layout-styles";
import { site, whatsappHref } from "@/lib/site";

export const metadata = {
  title: "Our Story",
  description: "The Vitamin Spot is Yas Bamanga’s shop in Abuja for supplements, vitamins, and IV bookings.",
};

export default function AboutPage() {
  return (
    <main className={`botanical ${pageShell}`}>
      <div className={`grid items-start lg:grid-cols-[1.05fr_0.95fr] ${pageWide} ${blockGap}`}>
        <div>
          <h1 className="font-display text-5xl leading-[0.95] text-deep md:text-7xl">
            Yas’s shop in Abuja.
          </h1>
          <div className="mt-8 max-w-xl space-y-5 text-base leading-8 text-deep/80">
            <p>
              The Vitamin Spot is where Yas Bamanga sells supplements and vitamins. Cranberry,
              tomato yeast, iron, collagen, and white tomato PQQ.
            </p>
            <p>IVs are separate. Book a time, or walk in. They don’t go in the bag.</p>
            <p>
              Lashes, brows, and training are Yas Beauty Allure. That’s a different business, and
              it isn’t sold here.
            </p>
          </div>
          <dl className="mt-10 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[11px] tracking-[0.2em] text-sage uppercase">Where</dt>
              <dd className="mt-1 text-deep">
                {site.address.full}. Message before you come if you want a time held.
              </dd>
            </div>
            <div>
              <dt className="text-[11px] tracking-[0.2em] text-sage uppercase">WhatsApp</dt>
              <dd className="mt-1 text-deep">{site.phone}</dd>
            </div>
            <div>
              <dt className="text-[11px] tracking-[0.2em] text-sage uppercase">Email</dt>
              <dd className="mt-1 text-deep">{site.email}</dd>
            </div>
            <div>
              <dt className="text-[11px] tracking-[0.2em] text-sage uppercase">Instagram</dt>
              <dd className="mt-1 text-deep">{site.instagramHandle}</dd>
            </div>
          </dl>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/shop">Shop</Button>
            <Button href="/infusions" variant="ghost">
              Book an IV
            </Button>
            <Button href={whatsappHref()} variant="ghost">
              WhatsApp
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Image
            src="/images/lifestyle/overhead-02.jpg"
            alt="Wellness essentials arranged on a table"
            width={700}
            height={900}
            className="col-span-2 aspect-[4/3] w-full rounded-xl object-cover"
            priority
          />
          <Image
            src="/images/products/cranberry/box.jpg"
            alt="Cranberry probiotic box"
            width={400}
            height={400}
            className="aspect-square w-full rounded-lg object-cover"
          />
          <Image
            src="/images/products/chiselan/vials.jpg"
            alt="Collagen vials"
            width={400}
            height={400}
            className="aspect-square w-full rounded-lg object-cover"
          />
        </div>
      </div>
    </main>
  );
}
