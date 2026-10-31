import { toast } from "sonner";

const DEFAULT_DURATION = 4500;
const ERROR_DURATION = 6500;

/** Dismissible, auto-expiring site alerts (Sonner). */
export function notify(message: string) {
  return toast.message(message, { duration: DEFAULT_DURATION });
}

export function notifySuccess(message: string) {
  return toast.success(message, { duration: DEFAULT_DURATION });
}

export function notifyError(message: string) {
  return toast.error(message, { duration: ERROR_DURATION });
}

export function notifyInfo(message: string) {
  return toast.info(message, { duration: DEFAULT_DURATION });
}

export function notifyDismiss(id?: string | number) {
  toast.dismiss(id);
}
