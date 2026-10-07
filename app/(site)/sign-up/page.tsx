import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { hasClerk } from "@/lib/env";

export const metadata = { title: "Create account" };

export default function SignUpPage() {
  if (!hasClerk()) {
    return (
      <main className="mx-auto max-w-lg px-5 py-20 text-center">
        <h1 className="font-display text-4xl text-deep">Create an account</h1>
        <p className="mt-4 leading-relaxed text-deep/70">Clerk keys are not set yet.</p>
      </main>
    );
  }

  return (
    <main className="grid min-h-[70vh] place-items-center px-5 py-16">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="font-display text-3xl text-deep md:text-4xl">Create an account</h1>
          <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-deep/65">
            Save your details and see your orders and drip bookings.
          </p>
        </div>

        <div className="flex justify-center">
          <SignUp routing="hash" forceRedirectUrl="/account" />
        </div>

        <div className="rounded-2xl border border-deep/10 bg-white p-4 text-center text-xs text-deep/70">
          <p className="font-medium text-deep">Prefer not to create an account?</p>
          <p className="mt-1 text-deep/60">
            You can still buy a pack or book a drip without one.
          </p>
          <div className="mt-3 flex items-center justify-center gap-4 font-medium">
            <Link href="/shop" className="text-deep underline hover:text-sage">
              See the packs
            </Link>
            <span className="text-deep/30">·</span>
            <Link href="/infusions" className="text-deep underline hover:text-sage">
              Book a drip
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
