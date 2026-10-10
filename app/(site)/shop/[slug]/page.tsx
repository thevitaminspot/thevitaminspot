import { notFound } from "next/navigation";
import { ProductCard } from "@/components/shop/product-card";
import { AddToBag } from "@/components/shop/add-to-bag";
import { ProductGallery } from "@/components/shop/product-gallery";
import { formatNaira } from "@/lib/money";
import { products } from "@/lib/catalog";
import { findProduct, findRelated } from "@/lib/data";
import { blockGap, pageShell, pageWide } from "@/components/ui/layout-styles";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: PageProps<"/shop/[slug]">) {
  const { slug } = await params;
  const product = await findProduct(slug);
  return {
    title: product?.name ?? "Product",
    description: product?.tagline,
  };
}

export default async function ProductPage({ params }: PageProps<"/shop/[slug]">) {
  const { slug } = await params;
  const product = await findProduct(slug);
  if (!product) notFound();
  const related = await findRelated(slug);

  return (
    <main className={`${pageShell} ${pageWide}`}>
      <div className={`grid lg:grid-cols-2 ${blockGap}`}>
        <ProductGallery images={product.images} productName={product.name} />
        <div>
          <h1 className="font-display text-5xl">{product.name}</h1>
          <p className="mt-4 max-w-md text-base leading-7 text-deep/75">{product.description}</p>
          <p className="mt-6 text-2xl text-deep">{formatNaira(product.price)}</p>
          {product.stock > 0 ? null : (
            <p className="mt-3 text-sm text-deep/60">Out of stock.</p>
          )}
          <AddToBag product={product} />
          <div className="mt-10 space-y-8 border-t border-deep/10 pt-8">
            <div>
              <h2 className="font-display text-3xl">What it does</h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-deep/75">
                {product.benefits.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-display text-3xl">What’s in it</h2>
              <p className="mt-3 text-sm leading-7 text-deep/75">{product.ingredients.join(", ")}.</p>
            </div>
            <div>
              <h2 className="font-display text-3xl">How to take it</h2>
              <p className="mt-3 text-sm leading-7 text-deep/75">{product.usage}</p>
            </div>
          </div>
        </div>
      </div>
      <section className="mt-12">
        <h2 className="font-display text-4xl">More</h2>
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {related.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </section>
    </main>
  );
}
