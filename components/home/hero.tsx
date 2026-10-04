import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero({
  packs,
}: {
  packs: { href: string; name: string; price: string; image: string }[];
}) {
  return (
    <section className="hero-wash">
      <div className="mx-auto grid max-w-[1100px] items-center gap-10 px-5 py-10 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
        <div className="order-2 lg:order-1">
          <p className="text-[12px] tracking-[0.16em] text-sage uppercase">Abuja</p>
          <h1 className="font-display mt-3 text-[4.25rem] leading-[0.84] text-deep sm:text-8xl">
            The packs.
          </h1>
          <p className="font-display mt-2 text-3xl text-sage italic sm:text-4xl">A chair for the drip.</p>
          <p className="mt-5 max-w-sm text-base leading-7 text-deep/75">
            Supplements and vitamins in Abuja. Book an IV here, or walk in.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button href="/shop">Shop the packs</Button>
            <Button href="/infusions" variant="ghost">
              Book an IV
            </Button>
          </div>
          {packs.length > 0 ? (
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
              {packs.map((pack) => (
                <li key={pack.href}>
                  <Link href={pack.href} className="text-sm text-deep/70 hover:text-deep">
                    {pack.name}
                    <span className="ml-2 text-deep/40">{pack.price}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="order-1 mx-auto w-full max-w-[420px] lg:order-2 lg:max-w-none">
          <div className="relative h-[460px] overflow-hidden rounded-t-[220px] rounded-b-[1.75rem] border border-deep/10 sm:h-[560px]">
            <Image
              src="/images/lifestyle/table-02.jpg"
              alt="Cranberry, tomato yeast, and collagen open on a table"
              fill
              priority
              className="object-cover object-[center_60%]"
              sizes="(min-width: 1024px) 480px, 100vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
