import {
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuSub,
  MenuSubTrigger,
  addDays,
  todayIso,
  useIsMobile,
} from "@doska/ui-kit"
import { CalendarDays, Check } from "lucide-react"
import { Suspense, lazy } from "react"
import type { Card, CardPatch } from "@doska/core"

const DeadlineCalendar = lazy(() => import("./deadline-calendar"))

export function DeadlineSub({
  card,
  onPatch,
  closeMenu,
}: {
  card: Card
  onPatch: (patch: CardPatch) => void
  closeMenu: () => void
}) {
  const isMobile = useIsMobile()

  const value = card.deadline
  const today = todayIso()
  const options = [
    { label: "Today", iso: today },
    { label: "Tomorrow", iso: addDays(today, 1) },
    { label: "In a week", iso: addDays(today, 7) },
  ]

  return (
    <MenuSub>
      <MenuSubTrigger>
        <CalendarDays />
        Deadline
      </MenuSubTrigger>
      <MenuContent align="start" sideOffset={2}>
        <MenuItem onClick={() => onPatch({ deadline: null })}>
          <CalendarDays className="text-muted-foreground" />
          No deadline
          {!value && <Check className="ml-auto" />}
        </MenuItem>
        {options.map((option) => (
          <MenuItem
            key={option.iso}
            onClick={() => onPatch({ deadline: option.iso })}
          >
            {option.label}
            {option.iso === value && <Check className="ml-auto" />}
          </MenuItem>
        ))}
        {isMobile ? (
          <label className="relative flex items-center px-3 py-1.5">
            Pick a date…
            <input
              type="date"
              value={value ?? ""}
              onChange={(e) => onPatch({ deadline: e.target.value || null })}
              onClick={(e) => e.currentTarget.showPicker?.()}
              onBlur={closeMenu}
              className="absolute inset-0 opacity-0"
              aria-label="Pick a date"
            />
          </label>
        ) : (
          <>
            <MenuSeparator />
            <Suspense fallback={null}>
              <DeadlineCalendar
                value={value}
                onSelect={(deadline) => {
                  onPatch({ deadline })
                  closeMenu()
                }}
              />
            </Suspense>
          </>
        )}
      </MenuContent>
    </MenuSub>
  )
}
