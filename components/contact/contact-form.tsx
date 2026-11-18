"use client";

import { useState, useTransition, type FormEvent } from "react";
import { submitContact } from "@/actions/contact";
import {
  formControl,
  formLabel,
  formSubmit,
  formTextarea,
} from "@/components/ui/form-styles";
import { notifyError, notifySuccess } from "@/lib/notify";
import { withActionError } from "@/lib/server-action-error";

export function ContactForm() {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    startTransition(async () => {
      const result = await withActionError(
        () =>
          submitContact({
            name: String(data.get("name") ?? ""),
            email: String(data.get("email") ?? ""),
            phone: String(data.get("phone") ?? ""),
            message: String(data.get("message") ?? ""),
          }),
        notifyError,
        "Could not send your note. Try again.",
      );
      if (!result) return;

      if (result.error) {
        notifyError(result.error);
        return;
      }

      form.reset();
      setSent(true);
      notifySuccess("Message sent — we’ll reply by email.");
    });
  }

  return (
    <section className="rounded-3xl bg-white p-6 sm:p-8">
      <h2 className="font-display text-4xl text-deep">Send us a note.</h2>
      <p className="mt-2 text-sm leading-6 text-deep/65">
        A pack, a drip, or a visit. We reply by email. WhatsApp is faster if you need us today.
      </p>

      {sent ? (
        <div className="mt-8 rounded-2xl bg-tint/50 px-5 py-8 text-center">
          <p className="font-display text-3xl text-deep">Got it.</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-deep/70">
            We have your note and will reply on the address you left.
          </p>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="mt-6 text-[11px] tracking-[0.16em] text-deep uppercase underline"
          >
            Send another
          </button>
        </div>
      ) : (
        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={formLabel}>
              Name
              <input name="name" required autoComplete="name" placeholder="Amina Bello" className={formControl} />
            </label>
            <label className={formLabel}>
              Email
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="amina@example.com"
                className={formControl}
              />
            </label>
          </div>
          <label className={formLabel}>
            Phone <span className="font-normal text-deep/40">optional</span>
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="0803 123 4567"
              className={formControl}
            />
          </label>
          <label className={formLabel}>
            Message
            <textarea
              name="message"
              required
              minLength={12}
              placeholder="A pack, a drip, or the hour you want to come by."
              className={formTextarea}
            />
          </label>

          <button type="submit" disabled={pending} className={formSubmit}>
            {pending ? "Sending" : "Send the note"}
          </button>
        </form>
      )}
    </section>
  );
}
