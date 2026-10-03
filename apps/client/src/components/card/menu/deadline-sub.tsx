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
import { useUpdateCard, useCard } from "@doska/core"

const DeadlineCalendar = lazy(() => import("./deadline-calendar"))

export function DeadlineSub({
  cardId,
  closeMenu,
}: {
  cardId: string
  closeMenu: () => void
}) {
  const { data: card } = useCard(cardId)
  const { mutate: updateCard } = useUpdateCard(cardId)
  const isMobile = useIsMobile()

  const value = card?.deadline ?? null
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
        <MenuItem onClick={() => updateCard({ deadline: null })}>
          <CalendarDays className="text-muted-foreground" />
          No deadline
          {!value && <Check className="ml-auto" />}
        </MenuItem>
        {options.map((option) => (
          <MenuItem
            key={option.iso}
            onClick={() => updateCard({ deadline: option.iso })}
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
              onChange={(e) => updateCard({ deadline: e.target.value || null })}
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
                  updateCard({ deadline })
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
