import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero({
  packs,
}: {
  packs: { href: string; name: string; price: string; image: string }[];
}) {
  const columns =
    packs.length >= 5
      ? "grid-cols-5"
      : packs.length === 4
        ? "grid-cols-4"
        : packs.length === 2
          ? "grid-cols-2"
          : "grid-cols-3";

  return (
    <section className="hero-wash">
      <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-5 py-12 md:px-8 lg:grid-cols-[0.86fr_1.14fr] lg:py-16">
        <div>
          <p className="text-[12px] tracking-[0.13em] text-sage uppercase">Abuja</p>
          <h1 className="font-display mt-3 max-w-xl text-5xl leading-[1.05] text-deep md:text-6xl">
            The packs. A chair for the drip.
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-deep/75">
            Supplements and vitamins in Abuja. Book an IV here, or walk in.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/shop">Shop the packs</Button>
            <Button href="/infusions" variant="ghost">
              Book an IV
            </Button>
          </div>
        </div>

        <div>
          <div className="relative aspect-[5/4] overflow-hidden rounded-xl border border-deep/10">
            <Image
              src="/images/lifestyle/table-01.jpg"
              alt="Supplements on a table"
              fill
              priority
              className="object-cover object-[center_40%]"
              sizes="(min-width: 1024px) 640px, 100vw"
            />
          </div>
          {packs.length > 0 ? (
            <ul className={`mt-3 grid gap-2 ${columns}`}>
              {packs.map((pack) => (
                <li key={pack.href}>
                  <Link href={pack.href} className="panel block overflow-hidden bg-white">
                    <span className="relative block aspect-square bg-tint">
                      {pack.image ? (
                        <Image src={pack.image} alt="" fill className="object-cover" sizes="160px" />
                      ) : null}
                    </span>
                    <span className="block px-2 py-2">
                      <span className="block truncate text-[11px] text-deep">{pack.name}</span>
                      <span className="block text-[11px] text-deep/55">{pack.price}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}
