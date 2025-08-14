/**
 * Gets or creates a session ID for the current browser session
 */
export function getSessionId(threadId: string): string {
  if (typeof window === "undefined") {
    // Fallback for SSR
    return `session-${threadId}`;
  }

  const sessionIdKey = `sicap-session-id-${threadId}`;
  let sessionId = sessionStorage.getItem(sessionIdKey);

  if (!sessionId) {
    sessionId = `session-${threadId}`;
    sessionStorage.setItem(sessionIdKey, sessionId);
  }

  return sessionId;
}
