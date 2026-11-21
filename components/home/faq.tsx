"use client";

import { useId, useState } from "react";
import { MessageCircle, Phone, Plus } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { homeFaqs } from "@/lib/faqs";
import { site, whatsappHref } from "@/lib/site";

export function Faq() {
  const baseId = useId();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="questions" className="faq-wash relative overflow-hidden px-5 py-20 md:px-8 md:py-28">
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start lg:gap-14">
        <Reveal className="min-w-0 lg:sticky lg:top-28 lg:col-span-4 lg:self-start">
          <p className="text-[11px] font-medium tracking-[0.22em] text-deep/65 uppercase">
            Questions
          </p>
          <h2 className="font-display mt-3 text-4xl leading-[1.04] text-deep text-balance md:text-5xl">
            Before you visit.
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-deep/75 text-pretty sm:text-base sm:leading-7">
            Delivery timing, what happens at a drip, and how payment works — the short answers.
          </p>

          <div className="mt-8 rounded-2xl border border-deep/10 bg-white/85 p-5 shadow-[0_1px_2px_rgba(11,44,33,0.03)]">
            <p className="text-sm font-medium text-deep">Still have a question?</p>
            <p className="mt-1 text-xs leading-relaxed text-deep/70">
              Message the lounge and we&apos;ll help you pick a pack or check chair availability.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <a
                href={whatsappHref("Hi The Vitamin Spot. I have a question.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-deep px-4 py-2.5 text-[11px] font-medium tracking-[0.14em] text-cream uppercase transition hover:bg-deep-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-deep"
              >
                <MessageCircle className="size-3.5" strokeWidth={1.75} aria-hidden />
                WhatsApp
              </a>
              <a
                href={`tel:${site.phoneHref}`}
                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-deep/15 bg-white px-4 py-2.5 text-xs font-medium text-deep transition hover:bg-cream/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-deep"
              >
                <Phone className="size-3.5 text-deep/65" strokeWidth={1.75} aria-hidden />
                Call us
              </a>
            </div>
          </div>
        </Reveal>

        <Reveal delay={80} className="min-w-0 lg:col-span-8">
          <div className="overflow-hidden rounded-2xl border border-deep/10 bg-white shadow-[0_1px_2px_rgba(11,44,33,0.03)]">
            {homeFaqs.map((faq, index) => {
              const isOpen = open === index;
              const panelId = `${baseId}-panel-${index}`;
              const buttonId = `${baseId}-button-${index}`;
              const isLast = index === homeFaqs.length - 1;

              return (
                <div
                  key={faq.question}
                  className={`transition-colors duration-200 ${
                    isOpen ? "bg-cream/35" : "bg-white"
                  } ${isLast ? "" : "border-b border-deep/8"}`}
                >
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpen(isOpen ? null : index)}
                    className="group flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-deep sm:px-7 sm:py-6"
                  >
                    <span className="flex min-w-0 items-baseline gap-3.5 sm:gap-4">
                      <span
                        className="shrink-0 text-xs font-medium tabular-nums text-deep/55"
                        aria-hidden
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="text-base font-medium leading-snug text-deep sm:text-[1.0625rem]">
                        {faq.question}
                      </span>
                    </span>

                    <span
                      aria-hidden
                      className={`inline-flex size-8 shrink-0 items-center justify-center rounded-full border transition duration-200 ${
                        isOpen
                          ? "border-deep bg-deep text-cream"
                          : "border-deep/15 bg-cream/40 text-deep/70 group-hover:border-deep/35 group-hover:bg-cream/80 group-hover:text-deep"
                      }`}
                    >
                      <Plus
                        className={`size-4 transition-transform duration-200 ${
                          isOpen ? "rotate-45" : ""
                        }`}
                        strokeWidth={1.75}
                      />
                    </span>
                  </button>

                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className="grid transition-[grid-template-rows,opacity] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{
                      gridTemplateRows: isOpen ? "1fr" : "0fr",
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <div className="overflow-hidden">
                      <div className="px-5 pb-6 pl-[3.1rem] sm:px-7 sm:pb-7 sm:pl-[3.85rem]">
                        <p className="max-w-2xl text-sm leading-relaxed text-deep/75 sm:text-[0.95rem] sm:leading-7">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
