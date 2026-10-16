import { useState } from "react"
import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuSub,
  MenuSubTrigger,
  MenuTrigger,
} from "@doska/ui-kit"
import { Check, Wrench } from "lucide-react"
import { webKeyValue } from "@/lib/adapters/web-kv"
import { ASKED_KEY } from "@/lib/persist"
import { ONBOARDING_SEEN_KEY } from "../onboarding/use-should-onboard"
import { OnboardingDeck } from "../onboarding/onboarding-deck"
import {
  WHATS_NEW_SEEN_KEY,
  WHATS_NEW_VERSION,
} from "../whats-new/whats-new-seen"
import { CARD_SHORTCUTS_SEEN_KEY } from "../card-panel/card-help-button"
import { DEV_TOASTS } from "./dev-toasts"
import { seedDemoBoards } from "./demo-boards"

const FLAGS = [
  { label: "Onboarding seen", key: ONBOARDING_SEEN_KEY, value: "1" },
  {
    label: `What's new ${WHATS_NEW_VERSION} seen`,
    key: WHATS_NEW_SEEN_KEY,
    value: WHATS_NEW_VERSION,
  },
  { label: "Card shortcuts seen", key: CARD_SHORTCUTS_SEEN_KEY, value: "true" },
  { label: "Storage persist asked", key: ASKED_KEY, value: "true" },
]

export function DevMenu() {
  // Bumped to re-read localStorage after a toggle
  const [, setTick] = useState(0)
  const [crashed, setCrashed] = useState(false)
  const [onboardingRun, setOnboardingRun] = useState(0)

  if (crashed) throw new Error("Thrown from the dev menu")

  function toggle(key: string, value: string) {
    if (webKeyValue.get(key) === value) webKeyValue.remove(key)
    else webKeyValue.set(key, value)
    setTick((tick) => tick + 1)
  }

  return (
    <>
      <Menu>
        <MenuTrigger
          render={
            <Button
              size="icon"
              variant="outline"
              aria-label="Dev menu"
              className="fixed right-6 bottom-16 z-50 opacity-50 hover:opacity-100"
            />
          }
        >
          <Wrench />
        </MenuTrigger>
        <MenuContent align="end" className="w-60">
          {FLAGS.map((flag) => (
            <MenuItem
              key={flag.key}
              closeOnClick={false}
              onClick={() => toggle(flag.key, flag.value)}
            >
              <span className="truncate">{flag.label}</span>
              {webKeyValue.get(flag.key) === flag.value && (
                <Check className="ml-auto" />
              )}
            </MenuItem>
          ))}
          <MenuSeparator />
          <MenuSub>
            <MenuSubTrigger>Show toast</MenuSubTrigger>
            <MenuContent align="start" sideOffset={2} className="w-52">
              {DEV_TOASTS.map((item) => (
                <MenuItem key={item.label} onClick={item.show}>
                  {item.label}
                </MenuItem>
              ))}
            </MenuContent>
          </MenuSub>
          <MenuItem onClick={() => setOnboardingRun((run) => run + 1)}>
            Show onboarding
          </MenuItem>
          <MenuItem onClick={() => void seedDemoBoards()}>
            Add demo boards
          </MenuItem>
          <MenuItem onClick={() => setCrashed(true)}>
            Throw error (error screen)
          </MenuItem>
          <MenuSeparator />
          <MenuItem onClick={() => window.location.reload()}>Reload</MenuItem>
          <MenuItem
            variant="destructive"
            onClick={() => {
              localStorage.clear()
              window.location.reload()
            }}
          >
            Clear localStorage and reload
          </MenuItem>
        </MenuContent>
      </Menu>
      {onboardingRun > 0 && <OnboardingDeck key={onboardingRun} shouldShow />}
    </>
  )
}
