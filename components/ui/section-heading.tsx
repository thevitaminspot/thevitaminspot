export function SectionHeading({
  eyebrow,
  title,
  copy,
  light = false,
}: {
  eyebrow: string;
  title: string;
  copy?: string;
  light?: boolean;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p
        className={`text-[11px] tracking-[0.22em] uppercase ${light ? "text-tint" : "text-sage"}`}
      >
        {eyebrow}
      </p>
      <h2
        className={`font-display mt-3 text-4xl leading-none md:text-6xl ${light ? "text-cream" : "text-deep"}`}
      >
        {title}
      </h2>
      {copy ? (
        <p className={`mt-5 text-base leading-7 ${light ? "text-cream/75" : "text-deep/70"}`}>
          {copy}
        </p>
      ) : null}
    </div>
  );
}
