export const homeFaqs = [
  {
    question: "Do you deliver the same day?",
    answer:
      "Order before 3pm and we can get it to you the same day in Maitama, Wuse, Asokoro, Garki, Jabi, Guzape, and nearby. Cooler packs travel in a cooler bag.",
  },
  {
    question: "What happens at a drip?",
    answer:
      "A nurse checks in with you first. Then you sit while it runs — usually 45 minutes to an hour. Walk in when it suits you, or book a chair online.",
  },
  {
    question: "What’s in the packs?",
    answer:
      "Each pack is what it says on the box. Open the product page for ingredients and how to take it. Unsure? Ask us before you buy.",
  },
  {
    question: "Can I just walk in?",
    answer:
      "Yes. The lounge is walk-in friendly. If you want a chair waiting, book a time or send a WhatsApp.",
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
] as const;

export function faqJsonLd(faqs: readonly { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
