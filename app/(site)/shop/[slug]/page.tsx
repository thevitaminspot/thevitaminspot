import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/shop/product-card";
import { AddToBag } from "@/components/shop/add-to-bag";
import { ProductGallery } from "@/components/shop/product-gallery";
import { formatNaira } from "@/lib/money";
import { products } from "@/lib/catalog";
import { findProduct, listProducts } from "@/lib/data";
import { pageShell, pageWide } from "@/components/ui/layout-styles";

export async function generateStaticParams() {
  const active = await listProducts();
  const source = active.length > 0 ? active : products;
  return source.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: PageProps<"/shop/[slug]">) {
  const { slug } = await params;
  const product = await findProduct(slug);
  return {
    title: product?.name ?? "Product",
    description: product?.tagline,
  };
}

function DetailSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-5">
      <h2 className="text-[11px] font-medium tracking-[0.2em] text-deep/45 uppercase">{label}</h2>
      <div className="mt-2.5 text-sm leading-relaxed text-deep/75">{children}</div>
    </section>
  );
}

export default async function ProductPage({ params }: PageProps<"/shop/[slug]">) {
  const { slug } = await params;
  const allProducts = await listProducts();
  const product = allProducts.find((item) => item.slug === slug);
  if (!product) notFound();
  const related = allProducts.filter((item) => item.slug !== slug).slice(0, 3);
  const hasDiscount = Boolean(
    product.compareAtPrice && product.compareAtPrice > product.price,
  );
  const inStock = product.stock > 0;

  return (
    <main className={`${pageShell} ${pageWide}`}>
      <nav className="text-[11px] tracking-[0.18em] text-deep/45 uppercase">
        <Link href="/shop" className="transition hover:text-deep">
          Shop
        </Link>
        <span className="mx-2 text-deep/25" aria-hidden>
          /
        </span>
        <span className="text-deep/65">{product.name}</span>
      </nav>

      <div className="mt-8 grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
        <ProductGallery images={product.images} productName={product.name} />

        <div className="flex min-w-0 flex-col">
          <h1 className="font-display text-4xl leading-[1.05] text-deep md:text-5xl">
            {product.name}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-deep/55">{product.tagline}</p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-deep/75">
            {product.description}
          </p>

          <div className="mt-7 border-t border-deep/10 pt-5">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="font-display text-3xl tracking-tight text-deep">
                {formatNaira(product.price)}
              </p>
              {hasDiscount ? (
                <p className="text-sm text-deep/35 line-through">
                  {formatNaira(product.compareAtPrice!)}
                </p>
              ) : null}
              <p className="text-[11px] tracking-[0.14em] text-deep/45 uppercase">
                {inStock ? "Ready to ship" : "Out of stock"}
              </p>
            </div>

            <div className="mt-5">
              <AddToBag product={product} />
            </div>
          </div>

          <div className="mt-6 divide-y divide-deep/10 border-t border-deep/10">
            {product.benefits.length > 0 ? (
              <DetailSection label="What it does">
                <ul className="space-y-1.5">
                  {product.benefits.map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <span className="mt-[0.55em] size-1 shrink-0 rounded-full bg-deep/35" aria-hidden />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </DetailSection>
            ) : null}

            {product.ingredients.length > 0 ? (
              <DetailSection label="What’s in it">
                <p>{product.ingredients.join(" · ")}</p>
              </DetailSection>
            ) : null}

            {product.usage ? (
              <DetailSection label="How to take it">
                <p>{product.usage}</p>
              </DetailSection>
            ) : null}
          </div>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-20 border-t border-deep/10 pt-12 md:mt-24 md:pt-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] tracking-[0.2em] text-deep/45 uppercase">Also in the shop</p>
              <h2 className="font-display mt-2 text-3xl text-deep md:text-4xl">More packs</h2>
            </div>
            <Link
              href="/shop"
              className="text-xs font-medium tracking-[0.15em] text-deep/65 uppercase transition hover:text-deep"
            >
              See all
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
