"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  return (
    <main className="mx-auto max-w-md px-5 py-20">
      <h1 className="font-display text-5xl">Your account</h1>
      <p className="mt-4 text-deep/70">
        You can still shop and book without one.
      </p>
      <form
        className="mt-8 space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const supabase = createSupabaseBrowser();
          if (!supabase) {
            setMessage("Add Supabase keys to enable login.");
            return;
          }
          const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
          });
          setMessage(error?.message ?? "Check your email for a quiet door.");
        }}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          className="w-full rounded-lg border border-deep/15 px-5 py-3"
        />
        <button className="w-full rounded-lg bg-deep py-3 text-[11px] tracking-[0.18em] text-cream uppercase">
          Email a magic link
        </button>
      </form>
      <button
        type="button"
        className="mt-4 w-full rounded-lg border border-deep/15 py-3 text-[11px] tracking-[0.18em] uppercase"
        onClick={async () => {
          const supabase = createSupabaseBrowser();
          if (!supabase) {
            setMessage("Add Supabase keys to enable Google.");
            return;
          }
          await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/auth/callback` },
          });
        }}
      >
        Continue with Google
      </button>
      {message ? <p className="mt-4 text-sm">{message}</p> : null}
    </main>
  );
}
