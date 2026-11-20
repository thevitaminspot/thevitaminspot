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

      <div className="relative mx-auto grid max-w-6xl gap-14 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:items-start lg:gap-20 xl:gap-28">
        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-[11px] tracking-[0.22em] text-deep/45 uppercase">Questions</p>
          <h2 className="font-display mt-4 text-4xl leading-[1.05] text-deep md:text-5xl lg:text-[3.25rem]">
            Before you come in.
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-deep/65">
            Delivery, drips, and paying — the short answers. If yours isn’t here, message the lounge.
          </p>

          <div className="mt-10 flex flex-col gap-3 border-t border-deep/12 pt-8">
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
          <div className="overflow-hidden rounded-2xl border border-deep/12 bg-white/35">
            {homeFaqs.map((faq, index) => {
              const isOpen = open === index;
              const panelId = `${baseId}-panel-${index}`;
              const buttonId = `${baseId}-button-${index}`;
              const isLast = index === homeFaqs.length - 1;

              return (
                <div
                  key={faq.question}
                  className={`transition-colors duration-300 ${
                    isOpen ? "bg-white" : "bg-transparent"
                  } ${isLast ? "" : "border-b border-deep/10"}`}
                >
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpen(isOpen ? null : index)}
                    className="group grid w-full grid-cols-[2.5rem_minmax(0,1fr)_2.75rem] items-start gap-x-4 px-5 py-6 text-left sm:grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] sm:gap-x-5 sm:px-7 sm:py-7 md:px-8"
                  >
                    <span
                      className={`mt-2 shrink-0 font-mono text-[11px] leading-none tracking-[0.14em] transition-colors duration-300 ${
                        isOpen ? "text-sage" : "text-deep/35"
                      }`}
                      aria-hidden
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span
                      className={`font-display min-w-0 text-xl leading-snug transition-colors duration-300 md:text-2xl ${
                        isOpen ? "text-deep" : "text-deep/85 group-hover:text-deep"
                      }`}
                    >
                      {faq.question}
                    </span>

                    <span
                      aria-hidden
                      className={`mt-0.5 inline-flex size-9 shrink-0 items-center justify-center justify-self-end rounded-full border border-solid transition-[background-color,border-color,color] duration-200 ${
                        isOpen
                          ? "border-deep bg-deep text-cream"
                          : "border-deep/25 bg-cream/40 text-deep/55 group-hover:border-deep/45 group-hover:bg-white group-hover:text-deep"
                      }`}
                    >
                      {isOpen ? (
                        <svg
                          viewBox="0 0 16 16"
                          className="size-3.5 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                        >
                          <path d="M3.5 8h9" />
                        </svg>
                      ) : (
                        <svg
                          viewBox="0 0 16 16"
                          className="size-3.5 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                        >
                          <path d="M8 3.5v9M3.5 8h9" />
                        </svg>
                      )}
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
                      <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_2.75rem] gap-x-4 px-5 pb-7 sm:grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] sm:gap-x-5 sm:px-7 sm:pb-8 md:px-8">
                        <span aria-hidden />
                        <p className="max-w-xl pt-1 text-sm leading-relaxed text-deep/70 sm:text-[0.95rem] sm:leading-7">
                          {faq.answer}
                        </p>
                        <span aria-hidden />
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
