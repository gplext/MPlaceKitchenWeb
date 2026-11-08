/** Turns an API error into one sentence a customer can act on. */
export function friendlyError(error: unknown, fallback = "Something went wrong. Please try again."): string {
  const message = error instanceof Error ? error.message : "";
  if (!message) return fallback;
  // Input validation errors arrive as a JSON list of issues; show the first one.
  if (message.startsWith("[")) {
    try {
      const issues = JSON.parse(message) as { message?: string }[];
      return issues[0]?.message || fallback;
    } catch {
      return fallback;
    }
  }
  return message;
}
