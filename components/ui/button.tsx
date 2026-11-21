import Link from "next/link";
import type { ComponentProps } from "react";

const styles = {
  primary:
    "bg-deep text-cream shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-deep-hover focus-visible:outline-deep",
  ghost:
    "border border-deep/15 bg-white/50 text-deep shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] hover:border-sage hover:bg-tint/40 focus-visible:outline-deep",
  cream:
    "bg-cream text-deep shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] hover:bg-tint focus-visible:outline-cream",
};

type ButtonProps = {
  href?: string;
  variant?: keyof typeof styles;
  className?: string;
  children: React.ReactNode;
} & ComponentProps<"button">;

export function Button({
  href,
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const classes = `inline-flex cursor-pointer items-center justify-center rounded-xl px-6 py-3.5 text-[11px] font-medium tracking-[0.16em] uppercase transition duration-300 active:scale-[0.98] focus-visible:outline focus-visible:outline-offset-4 disabled:cursor-not-allowed ${styles[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
