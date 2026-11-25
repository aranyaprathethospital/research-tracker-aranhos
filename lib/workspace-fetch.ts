export const sessionUnavailableEvent = "research-tracker:session-unavailable";

// Only use for same-origin protected workspace requests.
export async function workspaceFetch(path: `/api/${string}`, options?: RequestInit) {
  const response = await fetch(path, options);
  if (response.status === 401 && typeof window !== "undefined" && !options?.signal?.aborted) {
    window.dispatchEvent(new Event(sessionUnavailableEvent));
  }
  return response;
}
