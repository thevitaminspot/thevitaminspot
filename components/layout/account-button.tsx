"use client";

import { Show, UserButton } from "@clerk/nextjs";
import Link from "next/link";

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
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
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
            appearance={
              userButtonAppearance ?? {
                elements: {
                  userButtonAvatarBox: "size-7 ring-1 ring-deep/20",
                },
              }
            }
          />
        </div>
      </Show>
    </>
  );
}
