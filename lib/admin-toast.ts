import { toast } from "sonner";

export function adminNotify(message: string) {
  toast.message(message);
}

export function adminNotifySuccess(message: string) {
  toast.success(message);
}

export function adminNotifyError(message: string) {
  toast.error(message);
}
