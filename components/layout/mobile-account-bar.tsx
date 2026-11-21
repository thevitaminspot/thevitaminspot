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
        className="flex min-h-11 items-center justify-between gap-3 rounded-xl px-1 py-1 text-sm font-medium text-deep transition hover:text-deep/80"
      >
        <span className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-full bg-deep/[0.06] text-deep">
            <AccountIcon className="size-[1.125rem]" />
          </span>
          <span>
            <span className="block text-sm font-medium text-deep">Sign in</span>
            <span className="block text-xs font-normal text-deep/65">Orders &amp; bookings</span>
          </span>
        </span>
        <span className="text-[11px] font-medium tracking-[0.14em] text-deep/70 uppercase">
          Account →
        </span>
      </Link>
    );
  }

  return (
    <>
      <Show when="signed-out">
        <Link
          href="/login"
          onClick={onNavigate}
          className="flex min-h-11 items-center justify-between gap-3 rounded-xl px-1 py-1 text-sm font-medium text-deep transition hover:text-deep/80"
        >
          <span className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-deep/[0.06] text-deep">
              <AccountIcon className="size-[1.125rem]" />
            </span>
            <span>
              <span className="block text-sm font-medium text-deep">Sign in</span>
              <span className="block text-xs font-normal text-deep/65">Orders &amp; bookings</span>
            </span>
          </span>
          <span className="text-[11px] font-medium tracking-[0.14em] text-deep/70 uppercase">
            Account →
          </span>
        </Link>
      </Show>
      <Show when="signed-in">
        <div className="flex items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center">
            <UserButton
              appearance={{
                ...siteClerkAppearance,
                elements: {
                  ...siteClerkAppearance.elements,
                  userButtonAvatarBox: "size-9 ring-1 ring-deep/15",
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
            <div className="mt-0.5 flex items-center gap-2 text-xs text-deep/70">
              <Link
                href="/account/orders"
                onClick={onNavigate}
                className="underline-offset-2 transition hover:text-deep hover:underline"
              >
                Orders
              </Link>
              <span className="text-deep/30" aria-hidden>
                ·
              </span>
              <Link
                href="/account/bookings"
                onClick={onNavigate}
                className="underline-offset-2 transition hover:text-deep hover:underline"
              >
                Bookings
              </Link>
            </div>
          </div>
          <SignOutButton>
            <button
              type="button"
              onClick={onNavigate}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-deep/15 bg-cream/70 px-3 py-2 text-[11px] font-medium tracking-[0.12em] text-deep uppercase transition hover:border-deep/30 hover:bg-white"
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
