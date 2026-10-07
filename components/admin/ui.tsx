import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";
import type { ReactNode } from "react";
import { interactiveControl } from "@/components/ui/form-styles";

export function AdminFeedback({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  if (!message) return null;
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-tint/60 px-4 py-2.5 text-xs text-deep">
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className={`shrink-0 text-deep/50 transition hover:text-deep ${interactiveControl}`}
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

export function AdminFormPanel({
  title,
  description,
  onCancel,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  onCancel: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`scroll-mt-24 rounded-2xl border border-deep/15 bg-white p-6 ${className}`}
    >
      <div className="mb-4 flex items-start justify-between gap-4 border-b border-deep/10 pb-3">
        <div className="min-w-0">
          <p className="font-display text-xl text-deep">{title}</p>
          {description ? <p className="mt-1 text-xs text-deep/60">{description}</p> : null}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className={`shrink-0 rounded-lg border border-deep/15 px-3 py-1.5 text-xs font-medium tracking-[0.08em] text-deep uppercase transition hover:bg-tint ${interactiveControl}`}
        >
          Cancel
        </button>
      </div>
      {children}
    </div>
  );
}

export function AdminBackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mb-6 inline-flex items-center gap-2 text-[11px] tracking-[0.12em] text-deep/50 uppercase transition hover:text-deep"
    >
      <ArrowLeft className="size-3.5" aria-hidden />
      {label}
    </Link>
  );
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 border-b border-deep/8 pb-7 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] tracking-[0.22em] text-sage uppercase">{eyebrow}</p>
        ) : null}
        <h1 className="font-display text-4xl text-deep sm:text-[2.75rem]">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-deep/60">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function AdminSummaryStrip({
  items,
}: {
  items: { label: string; value: string; tone?: "default" | "attention" }[];
}) {
  return (
    <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-2xl border px-4 py-3.5 ${
            item.tone === "attention"
              ? "border-amber-200/80 bg-amber-50/70"
              : "border-deep/10 bg-white"
          }`}
        >
          <p className="text-[10px] tracking-[0.16em] text-deep/45 uppercase">{item.label}</p>
          <p className="mt-1 font-display text-2xl text-deep">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

export function AdminQuickActions({ children }: { children: ReactNode }) {
  return <div className="mb-8 flex flex-wrap gap-2">{children}</div>;
}

export function AdminQuickAction({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center rounded-full border border-deep/12 bg-white px-4 py-2 text-[11px] tracking-[0.1em] text-deep/70 uppercase transition hover:border-sage/50 hover:bg-cream/40 hover:text-deep ${interactiveControl}`}
    >
      {children}
    </Link>
  );
}

export function AdminStatCard({
  href,
  label,
  value,
  hint,
}: {
  href?: string;
  label: string;
  value: string;
  hint?: string;
}) {
  const className = "block rounded-2xl border border-deep/10 bg-white p-5 transition hover:border-deep/20";
  const body = (
    <>
      <span className="text-[11px] tracking-[0.16em] text-deep/45 uppercase">{label}</span>
      <span className="mt-3 block font-display text-3xl text-deep">{value}</span>
      {hint ? <span className="mt-2 block text-xs leading-5 text-deep/45">{hint}</span> : null}
    </>
  );

  if (!href) return <div className={className}>{body}</div>;
  return (
    <Link href={href} className={className}>
      {body}
    </Link>
  );
}

export function AdminSection({
  title,
  href,
  linkLabel = "View all",
  children,
  className = "",
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[11px] tracking-[0.18em] text-deep/45 uppercase">{title}</h2>
        {href ? (
          <Link href={href} className="text-[11px] tracking-[0.12em] text-sage uppercase hover:text-deep">
            {linkLabel}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function AdminPanel({
  children,
  className = "",
  clip = true,
}: {
  children: ReactNode;
  className?: string;
  /** Set false when rows have popovers/menus that extend outside the panel. */
  clip?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-deep/10 bg-white ${clip ? "overflow-hidden" : "overflow-visible"} ${className}`}
    >
      {children}
    </div>
  );
}

export function AdminEmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="px-5 py-10 text-center">
      <p className="text-sm text-deep/55">{children}</p>
    </div>
  );
}

export function AdminMessageCard({
  meta,
  children,
}: {
  meta: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-deep/10 bg-white px-5 py-4 transition hover:border-deep/15">
      <p className="text-[11px] tracking-[0.08em] text-deep/45">{meta}</p>
      <div className="mt-3 text-sm leading-7 text-deep/80">{children}</div>
    </article>
  );
}

export function AdminDetailCard({
  title,
  icon,
  children,
  className = "",
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`min-w-0 rounded-2xl border border-deep/10 bg-white p-5 sm:p-6 ${className}`}
    >
      <div className="flex items-center gap-2">
        {icon ? <span className="text-sage">{icon}</span> : null}
        <h2 className="font-display text-lg text-deep">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function AdminTableWrap({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <AdminPanel>
      <div className="overflow-x-auto">{children}</div>
      {footer}
    </AdminPanel>
  );
}

export function AdminTable({ children }: { children: ReactNode }) {
  return <table className="w-full min-w-[640px] text-left text-sm">{children}</table>;
}

export function AdminTableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-deep/8 bg-cream/20 text-[11px] tracking-[0.14em] text-deep/45 uppercase">
      {children}
    </thead>
  );
}

export function AdminTableRow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <tr className={`border-b border-deep/5 transition last:border-0 hover:bg-cream/25 ${className}`}>
      {children}
    </tr>
  );
}

export function AdminTableCell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3.5 align-top ${className}`}>{children}</td>;
}

export function AdminTableHeaderCell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <th className={`px-4 py-3 font-medium ${className}`}>{children}</th>;
}

const statusTone: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-900 ring-amber-200/80",
  PAID: "bg-sage/15 text-deep ring-sage/30",
  CONFIRMED: "bg-sage/15 text-deep ring-sage/30",
  PACKED: "bg-cream text-deep ring-deep/10",
  OUT_FOR_DELIVERY: "bg-cream text-deep ring-deep/10",
  DELIVERED: "bg-deep/5 text-deep/70 ring-deep/10",
  CANCELLED: "bg-deep/[0.04] text-deep/55 ring-deep/10",
  COMPLETED: "bg-deep/5 text-deep/70 ring-deep/10",
};

export function AdminStatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] tracking-[0.12em] uppercase ring-1 ring-inset ${
        statusTone[status] ?? "bg-white text-deep/60 ring-deep/10"
      }`}
    >
      {label ?? status.replaceAll("_", " ")}
    </span>
  );
}

export function AdminFilterTabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: string; label: string; count: number }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="mb-4 flex gap-1 overflow-x-auto border-b border-deep/10">
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`shrink-0 border-b-2 px-3 py-2.5 text-sm transition ${interactiveControl} ${
              active
                ? "border-deep font-medium text-deep"
                : "border-transparent text-deep/50 hover:text-deep"
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 tabular-nums ${active ? "text-deep/55" : "text-deep/35"}`}>
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
