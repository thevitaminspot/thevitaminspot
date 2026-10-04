import { redirect } from "next/navigation";

export default async function BookPage({ searchParams }: PageProps<"/book">) {
  const params = await searchParams;
  const drip = typeof params.drip === "string" ? params.drip : "";
  redirect(drip ? `/infusions?drip=${encodeURIComponent(drip)}` : "/infusions");
}
