"use client";

import { Show, UserButton } from "@clerk/nextjs";
import { Calendar, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { siteClerkAppearance } from "@/lib/clerk-appearance";
import { useClientMounted } from "@/lib/hooks/use-client-mounted";

function AccountIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
      aria-hidden
    >
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5.5 19.25c1.6-3.1 3.9-4.5 6.5-4.5s4.9 1.4 6.5 4.5" strokeLinecap="round" />
    </svg>
  );
}

export function AccountButton({
  className = "",
  onNavigate,
  userButtonAppearance,
}: {
  className?: string;
  onNavigate?: () => void;
  userButtonAppearance?: {
    elements?: {
      userButtonAvatarBox?: string;
    };
  };
}) {
  const mounted = useClientMounted();
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const controlClass = `nav-icon grid size-10 place-items-center rounded-full sm:size-11 ${className}`;

  if (!clerkEnabled || !mounted) {
    return (
      <Link href="/login" className={controlClass} onClick={onNavigate} aria-label="Account">
        <AccountIcon />
      </Link>
    );
  }

  return (
    <>
      <Show when="signed-out">
        <Link href="/login" className={controlClass} onClick={onNavigate} aria-label="Account">
          <AccountIcon />
        </Link>
      </Show>
      <Show when="signed-in">
        <div className={controlClass}>
          <UserButton
            appearance={{
              ...siteClerkAppearance,
              elements: {
                ...siteClerkAppearance.elements,
                ...userButtonAppearance?.elements,
                userButtonAvatarBox:
                  userButtonAppearance?.elements?.userButtonAvatarBox ??
                  "size-8 ring-1 ring-deep/20",
              },
            }}
          >
            <UserButton.MenuItems>
              <UserButton.Action label="manageAccount" />
              <UserButton.Link
                label="My orders"
                labelIcon={<ShoppingBag className="size-4" />}
                href="/account/orders"
              />
              <UserButton.Link
                label="My bookings"
                labelIcon={<Calendar className="size-4" />}
                href="/account/bookings"
              />
              <UserButton.Action label="signOut" />
            </UserButton.MenuItems>
          </UserButton>
        </div>
      </Show>
    </>
  );
}
