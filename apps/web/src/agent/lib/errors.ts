export type ExtractedTransportError = {
  code?: string;
  message: string;
};

export function extractTransportError(error: unknown): ExtractedTransportError {
  // Default message fallback
  let fallbackMessage = "A apărut o eroare";

  // If it's an Error, start with its message
  if (error instanceof Error) {
    fallbackMessage = error.message || fallbackMessage;

    // Prefer structured cause when available
    const cause = (error as unknown as { cause?: unknown }).cause;
    if (cause && typeof cause === "object" && cause !== null) {
      const maybeCode = (cause as Record<string, unknown>).code;
      if (typeof maybeCode === "string") {
        return { code: maybeCode, message: fallbackMessage };
      }
    }

    // Fallback: many transports stringify the JSON body into message
    try {
      const parsed = JSON.parse(error.message) as { error?: string; code?: string };
      if (parsed && (parsed.error || parsed.code)) {
        return {
          code: parsed.code,
          message: parsed.error || fallbackMessage,
        };
      }
    } catch {}

    return { message: fallbackMessage };
  }

  // Non-Error values
  if (typeof error === "string") {
    try {
      const parsed = JSON.parse(error) as { error?: string; code?: string };
      return { code: parsed.code, message: parsed.error || error };
    } catch {
      return { message: error };
    }
  }

  return { message: fallbackMessage };
}
