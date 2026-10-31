"use client";

import { Show, SignOutButton, UserButton } from "@clerk/nextjs";
import { Calendar, LogOut, ShoppingBag } from "lucide-react";
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

export function MobileAccountBar({ onNavigate }: { onNavigate?: () => void }) {
  const mounted = useClientMounted();
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  if (!clerkEnabled || !mounted) {
    return (
      <Link
        href="/login"
        onClick={onNavigate}
        className="flex min-h-12 items-center gap-3 rounded-2xl border border-deep/10 bg-white/70 px-3.5 py-2.5 text-sm font-medium text-deep transition hover:border-deep/20"
      >
        <span className="grid size-10 place-items-center rounded-full bg-deep/[0.06] text-deep">
          <AccountIcon />
        </span>
        Sign in
      </Link>
    );
  }

  return (
    <>
      <Show when="signed-out">
        <Link
          href="/login"
          onClick={onNavigate}
          className="flex min-h-12 items-center gap-3 rounded-2xl border border-deep/10 bg-white/70 px-3.5 py-2.5 text-sm font-medium text-deep transition hover:border-deep/20"
        >
          <span className="grid size-10 place-items-center rounded-full bg-deep/[0.06] text-deep">
            <AccountIcon />
          </span>
          Sign in
        </Link>
      </Show>
      <Show when="signed-in">
        <div className="flex items-center gap-2.5 rounded-2xl border border-deep/10 bg-white/70 p-2.5">
          <div className="grid size-11 shrink-0 place-items-center">
            <UserButton
              appearance={{
                ...siteClerkAppearance,
                elements: {
                  ...siteClerkAppearance.elements,
                  userButtonAvatarBox: "size-10 ring-1 ring-deep/15",
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
              </UserButton.MenuItems>
            </UserButton>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-deep">Account</p>
            <p className="text-xs text-deep/45">Orders &amp; bookings</p>
          </div>
          <SignOutButton>
            <button
              type="button"
              onClick={onNavigate}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-deep/12 bg-cream/80 px-3 py-2.5 text-[11px] font-medium tracking-[0.12em] text-deep uppercase transition hover:border-deep/25 hover:bg-white"
            >
              <LogOut className="size-3.5" strokeWidth={1.5} aria-hidden />
              Sign out
            </button>
          </SignOutButton>
        </div>
      </Show>
    </>
  );
}
