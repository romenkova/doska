import { SheetAction, SheetBar, useTokens } from "@doska/ui-kit-mobile"
import DateTimePicker from "@react-native-community/datetimepicker"
import { useState } from "react"
import { View } from "react-native"

/** A deadline is a plain `YYYY-MM-DD`, so it is read and written in local time:
 * `new Date("2026-08-03")` is UTC midnight, which is the 2nd west of Greenwich. */
function toDate(iso: string | null): Date {
  if (!iso) return new Date()
  const [year, month, day] = iso.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function toIso(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

interface IProps {
  value: string | null
  onCommit: (value: string | null) => void
  onClose: () => void
}

/** Picks a card's deadline — the system calendar, with the web's Clear and
 * Save. The pick is a draft until saved, so a mis-tap costs nothing. */
export function DeadlineForm({ value, onCommit, onClose }: IProps) {
  const { primary } = useTokens()
  const [draft, setDraft] = useState(value)

  return (
    <View>
      <SheetBar
        title="Due date"
        leading={{ label: "Cancel", onPress: onClose }}
        trailing={{
          label: "Save",
          onPress: () => {
            if (draft !== value) onCommit(draft)
            onClose()
          },
        }}
      />

      <DateTimePicker
        value={toDate(draft)}
        mode="date"
        // The month grid rather than the wheels — the only iOS display that is
        // a calendar at all.
        display="inline"
        accentColor={primary}
        onChange={(_event, date) => {
          if (date) setDraft(toIso(date))
        }}
      />

      {draft ? (
        <SheetAction
          label="Clear date"
          role="destructive"
          onPress={() => setDraft(null)}
        />
      ) : null}
    </View>
  )
}
