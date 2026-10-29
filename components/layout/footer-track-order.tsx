import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { hasClerk } from "@/lib/env";

export async function FooterTrackOrder() {
  if (!hasClerk()) return null;
  const { userId } = await auth();
  if (!userId) return null;

  return (
    <li>
      <Link href="/account/orders" className="text-cream/85 hover:text-tint">
        Track my order
      </Link>
    </li>
  );
}
