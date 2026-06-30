import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { cn } from "./lib/cn"
import { useIsMobile } from "./lib/use-mobile"
import type { DateInputCalendarProps } from "./date-input-calendar"
import { Input } from "./input"

const DateInputCalendar = React.lazy(() => import("./date-input-calendar"))

interface DateInputProps {
  value: string | null
  onChange?: (value: string | null) => void
  /**
   * The clickable element. On desktop it opens a calendar popover; on mobile
   * the OS-native date picker is layered on top for a native experience.
   */
  children: React.ReactNode
  className?: string
  /** Forwarded to the native `<input type="date">` (min/max, disabled, …). */
  inputProps?: Omit<
    React.ComponentProps<"input">,
    "type" | "value" | "onChange" | "className"
  >
  /** Extra props for the desktop `<Calendar>` (disabled days, locale, …). */
  calendarProps?: DateInputCalendarProps["calendarProps"]
}

/**
 * A date picker that adapts to the viewport: a calendar popover on large
 * screens, and the OS-native date input on small screens. The `value` is an
 * ISO `yyyy-MM-dd` string (or `null`). The calendar is loaded lazily, so it is
 * never fetched on mobile.
 */
function DateInput({
  value,
  onChange,
  children,
  className,
  inputProps,
  calendarProps,
}: DateInputProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)

  if (isMobile) {
    return (
      <span className={cn("relative inline-flex", className)}>
        {children}
        <Input
          type="date"
          value={value ?? ""}
          onChange={(e) => onChange?.(e.target.value || null)}
          onClick={(e) => e.currentTarget.showPicker?.()}
          className="absolute inset-0 cursor-pointer opacity-0"
          {...inputProps}
        />
      </span>
    )
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        className={cn("inline-flex", className)}
        render={<span />}
      >
        {children}
      </PopoverPrimitive.Trigger>
      {open && (
        <React.Suspense fallback={null}>
          <DateInputCalendar
            value={value}
            onSelect={(next) => {
              onChange?.(next)
              setOpen(false)
            }}
            calendarProps={calendarProps}
          />
        </React.Suspense>
      )}
    </PopoverPrimitive.Root>
  )
}

export { DateInput }
