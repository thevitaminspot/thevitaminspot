"use client";

import { Show, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { siteClerkAppearance } from "@/lib/clerk-appearance";
import { useClientMounted } from "@/lib/hooks/use-client-mounted";

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

  if (!clerkEnabled || !mounted) {
    return (
      <Link href="/login" className={className} onClick={onNavigate}>
        Account
      </Link>
    );
  }

  return (
    <>
      <Show when="signed-out">
        <Link href="/login" className={className} onClick={onNavigate}>
          Account
        </Link>
      </Show>
      <Show when="signed-in">
        <div className="flex items-center gap-2.5">
          <Link href="/account" className={className} onClick={onNavigate}>
            Account
          </Link>
          <UserButton
            appearance={{
              ...siteClerkAppearance,
              elements: {
                ...siteClerkAppearance.elements,
                ...userButtonAppearance?.elements,
                userButtonAvatarBox:
                  userButtonAppearance?.elements?.userButtonAvatarBox ??
                  "size-7 ring-1 ring-deep/20",
              },
            }}
          />
        </div>
      </Show>
    </>
  );
}
