import { redirect } from "next/navigation";

export const metadata = { title: "Account", robots: { index: false, follow: false } };
export const instant = false;

export default function AccountPage() {
  redirect("/account/orders");
}
