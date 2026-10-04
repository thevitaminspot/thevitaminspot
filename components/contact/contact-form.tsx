"use client";

import { useState } from "react";
import { submitContact } from "@/actions/contact";

export function ContactForm() {
  const [message, setMessage] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const result = await submitContact({
          name: String(form.get("name") ?? ""),
          email: String(form.get("email") ?? ""),
          phone: String(form.get("phone") ?? ""),
          message: String(form.get("message") ?? ""),
        });
        setMessage(result.error ?? "Got it. We’ll reply.");
      }}
    >
      <input name="name" required placeholder="Name" className="w-full rounded-lg border border-deep/15 px-5 py-3" />
      <input name="email" type="email" required placeholder="Email" className="w-full rounded-lg border border-deep/15 px-5 py-3" />
      <input name="phone" placeholder="Phone" className="w-full rounded-lg border border-deep/15 px-5 py-3" />
      <textarea name="message" required placeholder="Your note" className="min-h-36 w-full rounded-lg border border-deep/15 px-5 py-3" />
      <button className="rounded-lg bg-deep px-6 py-3 text-[11px] tracking-[0.18em] text-cream uppercase">
        Send
      </button>
      {message ? <p className="text-sm">{message}</p> : null}
    </form>
  );
}
