import Link from "next/link";
import type { ComponentProps } from "react";

const styles = {
  primary:
    "bg-deep text-cream hover:bg-sage focus-visible:outline-deep",
  ghost:
    "border border-deep/15 bg-transparent text-deep hover:border-sage hover:bg-tint/40",
  cream:
    "bg-cream text-deep hover:bg-tint focus-visible:outline-cream",
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
  const classes = `inline-flex cursor-pointer items-center justify-center rounded-lg px-6 py-3.5 text-sm tracking-[0.1em] uppercase transition duration-300 focus-visible:outline focus-visible:outline-offset-4 disabled:cursor-not-allowed ${styles[variant]} ${className}`;

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
