"use client";

import { useId, useState } from "react";
import { Reveal } from "@/components/ui/reveal";
import { homeFaqs } from "@/lib/faqs";
import { site, whatsappHref } from "@/lib/site";

export function Faq() {
  const baseId = useId();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="questions" className="faq-wash relative overflow-hidden px-5 py-20 md:px-8 md:py-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-deep/15 to-transparent" />

      <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] lg:gap-16 xl:gap-24">
        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-[11px] tracking-[0.22em] text-deep/45 uppercase">Questions</p>
          <h2 className="font-display mt-3 text-4xl leading-[1.05] text-deep md:text-5xl lg:text-[3.25rem]">
            Before you come in.
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-deep/65">
            Delivery, drips, and paying — the short answers. If yours isn’t here, message the lounge.
          </p>

          <div className="mt-8 flex flex-col gap-3 border-t border-deep/12 pt-8">
            <a
              href={whatsappHref("Hi The Vitamin Spot. I have a question.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center justify-center rounded-xl bg-deep px-5 py-3 text-[11px] font-medium tracking-[0.16em] text-cream uppercase transition hover:bg-[#14382a]"
            >
              Ask on WhatsApp
            </a>
            <a
              href={`tel:${site.phoneHref}`}
              className="text-sm text-deep/60 transition hover:text-deep"
            >
              Or call {site.phone}
            </a>
          </div>
        </Reveal>

        <Reveal delay={90}>
          <div className="divide-y divide-deep/12 border-y border-deep/12">
            {homeFaqs.map((faq, index) => {
              const isOpen = open === index;
              const panelId = `${baseId}-panel-${index}`;
              const buttonId = `${baseId}-button-${index}`;

              return (
                <div
                  key={faq.question}
                  className={`transition-colors duration-300 ${isOpen ? "bg-white/45" : ""}`}
                >
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpen(isOpen ? null : index)}
                    className="group flex w-full items-start gap-4 py-5 text-left md:gap-6 md:py-6"
                  >
                    <span
                      className={`mt-1 shrink-0 font-mono text-[11px] tracking-[0.14em] transition-colors duration-300 ${
                        isOpen ? "text-sage" : "text-deep/35"
                      }`}
                      aria-hidden
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span
                        className={`font-display block text-xl leading-snug transition-colors duration-300 md:text-2xl ${
                          isOpen ? "text-deep" : "text-deep/85 group-hover:text-deep"
                        }`}
                      >
                        {faq.question}
                      </span>
                    </span>

                    <span
                      aria-hidden
                      className={`mt-1.5 grid size-8 shrink-0 place-items-center rounded-full border transition duration-300 ${
                        isOpen
                          ? "border-deep bg-deep text-cream"
                          : "border-deep/15 text-deep/45 group-hover:border-deep/30 group-hover:text-deep"
                      }`}
                    >
                      <svg
                        viewBox="0 0 16 16"
                        className={`size-3.5 transition-transform duration-300 ease-out ${
                          isOpen ? "rotate-45" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M8 3v10M3 8h10" strokeLinecap="round" />
                      </svg>
                    </span>
                  </button>

                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className="grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{
                      gridTemplateRows: isOpen ? "1fr" : "0fr",
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <div className="overflow-hidden">
                      <p className="max-w-xl pb-6 pl-[2.75rem] text-sm leading-relaxed text-deep/70 md:pl-[3.25rem] md:text-[0.95rem] md:leading-7">
                        {faq.answer}
                      </p>
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
