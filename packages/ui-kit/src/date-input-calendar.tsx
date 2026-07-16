import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { format, isValid, parse } from "date-fns"
import { X } from "lucide-react"
import { Button } from "./button"
import { Calendar } from "./calendar"
import { cn } from "./lib/cn"

const ISO = "yyyy-MM-dd"

function isoToDate(value: string | null | undefined) {
  if (!value) return undefined
  const date = parse(value, ISO, new Date())
  return isValid(date) ? date : undefined
}

function dateToIso(date: Date | undefined) {
  return date ? format(date, ISO) : null
}

export interface DateInputCalendarProps {
  value: string | null
  onSelect: (value: string | null) => void
  calendarProps?: Omit<
    React.ComponentProps<typeof Calendar>,
    "mode" | "selected" | "onSelect"
  >
}

/**
 * The desktop calendar popover content. Lives in its own module so the calendar
 * (and `react-day-picker`/`date-fns`) is only fetched when first opened, never
 * on mobile where the native date input is used instead.
 */
export default function DateInputCalendar({
  value,
  onSelect,
  calendarProps,
}: DateInputCalendarProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        sideOffset={4}
        align="start"
        className="z-60"
      >
        <PopoverPrimitive.Popup
          data-slot="date-input-popup"
          className={cn(
            "overflow-hidden rounded-lg border bg-popover",
            "text-popover-foreground shadow-md outline-none",
            "transition-[opacity,transform] duration-50",
            "data-ending-style:opacity-0 data-starting-style:opacity-0",
            "data-starting-style:scale-95"
          )}
        >
          <Calendar
            mode="single"
            selected={isoToDate(value)}
            onSelect={(date) => onSelect(dateToIso(date))}
            autoFocus
            {...calendarProps}
          />
          <div className="grid grid-cols-2 gap-1 border-t p-1 bg-background">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelect(null)}
              className="text-muted-foreground"
            >
              <X className="size-3.5" />
              Clear
            </Button>
            <PopoverPrimitive.Close
              render={
                <Button variant="ghost" size="sm">
                  Save
                </Button>
              }
            />
          </div>
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}
