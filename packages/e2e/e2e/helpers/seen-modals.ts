import { WHATS_NEW_VERSION } from "../../../../apps/client/src/components/whats-new/whats-new-seen"

/**
 * Storage state with onboarding and what's new already seen, so the deck and
 * the toast stay out of every spec but their own (`e2e/onboarding`).
 */
export function seenModals(origin: string, { whatsNew = true } = {}) {
  const localStorage = [{ name: "onboarding-seen", value: "1" }]
  if (whatsNew)
    localStorage.push({ name: "whats-new-seen", value: WHATS_NEW_VERSION })
  return { cookies: [], origins: [{ origin, localStorage }] }
}
