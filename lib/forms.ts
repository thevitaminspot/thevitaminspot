import { zodResolver } from "@hookform/resolvers/zod";
import type { FieldValues, UseFormProps } from "react-hook-form";
import type { ZodType } from "zod";

export function zodFormOptions<T extends FieldValues>(
  schema: ZodType<T, T>,
  options?: Omit<UseFormProps<T>, "resolver">,
): UseFormProps<T> {
  return {
    ...options,
    resolver: zodResolver(schema),
  };
}
