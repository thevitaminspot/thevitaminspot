"use client";

import { useState } from "react";
import { Reveal } from "@/components/ui/reveal";

const faqs = [
  {
    question: "Do you deliver the same day?",
    answer:
      "Order before 3pm and we can get it to you the same day in Maitama, Wuse, Asokoro, Garki, Jabi, Guzape, and nearby. If it needs to stay cool, it goes in a cooler bag.",
  },
  {
    question: "What happens at a drip?",
    answer:
      "A nurse checks in with you first. Then you sit while it runs, usually 45 minutes to an hour.",
  },
  {
    question: "What’s in the packs?",
    answer:
      "Each pack is what it says on the box. Open the product page for the ingredients and how to take it. If you’re unsure, ask us before you buy.",
  },
  {
    question: "Can I just walk in?",
    answer: "Yes. If you want a chair waiting, book a time or send a WhatsApp.",
  },
  {
    question: "How do I pay?",
    answer:
      "Online it’s card, transfer, or USSD through Paystack. In the shop we take transfer and POS.",
  },
  {
    question: "Can I ask before I buy?",
    answer: "Yes. WhatsApp, call, or come into the shop and we’ll help you pick.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,18rem)_1fr] lg:gap-20">
        <Reveal>
          <p className="text-[11px] tracking-[0.22em] text-deep/45 uppercase">Questions</p>
          <h2 className="font-display mt-3 text-4xl leading-tight text-deep md:text-5xl">
            Good to know.
          </h2>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-deep/65">
            Delivery, drips, and paying. Ask us if yours isn’t here.
          </p>
        </Reveal>
        <Reveal delay={80}>
          <div className="border-t border-deep/15">
            {faqs.map((faq, index) => {
              const isOpen = open === index;
              return (
                <div key={faq.question} className="border-b border-deep/15">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-6 py-5 text-left transition-colors hover:text-sage"
                  >
                    <span className="font-display text-xl leading-snug text-deep md:text-2xl">
                      {faq.question}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`text-lg text-deep/40 transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}
                    >
                      +
                    </span>
                  </button>
                  <div
                    className="grid transition-[grid-template-rows,opacity] duration-300 ease-out"
                    style={{
                      gridTemplateRows: isOpen ? "1fr" : "0fr",
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <div className="overflow-hidden">
                      <p className="max-w-xl pb-5 text-sm leading-relaxed text-deep/75">
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
