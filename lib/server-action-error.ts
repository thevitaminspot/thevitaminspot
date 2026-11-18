/** Run a server action and map thrown network/size errors into UI copy. */
export async function withActionError<T>(
  work: () => Promise<T>,
  onError: (message: string) => void,
  fallback = "Something went wrong. Try again.",
): Promise<T | undefined> {
  try {
    return await work();
  } catch (error) {
    onError(serverActionErrorMessage(error, fallback));
    return undefined;
  }
}

/** Map thrown Server Action / network errors to copy for admins. */
export function serverActionErrorMessage(error: unknown, fallback = "Something went wrong. Try again.") {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";

  const lower = message.toLowerCase();

  if (lower.includes("body exceeded") || lower.includes("bodysizelimit")) {
    return "That upload or save is too large. Use a smaller image (under 8MB), or save again after pictures finish uploading.";
  }

  if (lower.includes("failed to fetch") || lower.includes("network")) {
    return "Connection failed. Check your network and try again.";
  }

  return message.trim() || fallback;
}

export function estimateServerActionBytes(payload: unknown) {
  try {
    return new TextEncoder().encode(JSON.stringify(payload)).length;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

/** Stay under the configured serverActions.bodySizeLimit with JSON overhead. */
export const SERVER_ACTION_SOFT_LIMIT_BYTES = 8 * 1024 * 1024;
