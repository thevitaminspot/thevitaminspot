import { Faq, ProductStories, WalkIn } from "@/components/home/home-sections";
import { Hero } from "@/components/home/hero";
import { listProducts } from "@/lib/data";

function nairaLabel(kobo: number) {
  const amount = Math.round(kobo / 100).toString();
  return `₦${amount.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export default async function HomePage() {
  const featured = (await listProducts()).filter((product) => product.featured);

  return (
    <main>
      <Hero
        packs={featured.map((product) => ({
          href: `/shop/${product.slug}`,
          name: product.name,
          price: nairaLabel(product.price),
          image: product.images[0]?.url ?? "",
        }))}
      />
      <ProductStories products={featured} />
      <WalkIn />
      <Faq />
    </main>
  );
}
