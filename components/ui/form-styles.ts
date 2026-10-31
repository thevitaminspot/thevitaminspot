/** Shared field styles — keep customer and admin forms in sync. */

/** Pointer on all clickable controls; pair with disabled opacity rules. */
export const interactiveControl = "cursor-pointer disabled:cursor-not-allowed";

const controlBase =
  "w-full border border-deep/15 text-sm text-deep placeholder:text-deep/40 transition focus:border-deep/40 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";

/** Customer-facing labels (checkout, contact, booking). */
export const formLabel = "block text-xs font-medium text-deep/70";

export const formControl = `mt-1.5 rounded-xl bg-cream/30 px-4 py-3 ${controlBase} focus:bg-white`;

/** Date/time inputs — keep within mobile viewports (iOS date picker is wide). */
export const formDateControl = `${formControl} box-border max-w-full min-w-0 appearance-none`;

export const formSelect = `${formControl} cursor-pointer`;

export const formTextarea = `${formControl} min-h-36 resize-y`;

export const formError = "text-sm text-deep";

export const formErrorBox =
  "rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700";

export const formSubmit = `inline-flex w-full items-center justify-center rounded-xl bg-deep px-6 py-3.5 text-[11px] font-medium tracking-[0.16em] text-cream uppercase transition hover:bg-[#14382a] disabled:opacity-60 ${interactiveControl}`;

export const formSubmitInline = `inline-flex items-center justify-center rounded-xl bg-deep px-6 py-3.5 text-[11px] font-medium tracking-[0.16em] text-cream uppercase transition hover:bg-[#14382a] disabled:opacity-50 ${interactiveControl}`;

export const formButtonSecondary = `inline-flex items-center justify-center rounded-xl border border-deep/15 bg-cream/40 px-5 py-3.5 text-[11px] font-medium tracking-[0.16em] text-deep uppercase transition hover:bg-white disabled:opacity-50 ${interactiveControl}`;

export const formButtonGhost = `inline-flex items-center justify-center rounded-xl border border-deep/20 px-5 py-3 text-sm text-deep transition hover:bg-cream/40 disabled:opacity-40 ${interactiveControl}`;

export const adminButtonPrimary = `${interactiveControl} rounded-lg bg-deep px-4 py-2 text-[11px] tracking-[0.16em] text-cream uppercase transition hover:bg-sage disabled:opacity-50`;

export const adminButtonSecondary = `${interactiveControl} rounded-lg border border-deep/15 px-4 py-2 text-[11px] tracking-[0.16em] text-deep uppercase transition hover:bg-tint disabled:opacity-50`;

export const adminButtonDanger = `${interactiveControl} rounded-lg border border-red-200 px-4 py-2 text-[11px] tracking-[0.16em] text-red-700 uppercase transition hover:bg-red-50 disabled:opacity-40`;

export const adminButtonTab = `${interactiveControl} rounded-lg px-3 py-1.5 text-xs font-medium transition`;

/** Compact admin dashboard fields. */
export const adminFormLabel = formLabel;

export const adminFormControl = `rounded-lg bg-white px-3.5 py-2.5 ${controlBase}`;

/** Stacked admin label + field (includes top margin). */
export const adminFormField = `${adminFormControl} mt-1.5`;

export const adminFormTextarea = `${adminFormControl} min-h-24 resize-y`;

export const adminFormSelect = `${adminFormControl} cursor-pointer`;
