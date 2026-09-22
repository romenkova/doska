import { Input, SheetBar } from "@doska/ui-kit-mobile"
import { useState } from "react"
import { View } from "react-native"

interface IProps {
  title: string
  placeholder: string
  confirmLabel: string
  initial?: string
  onCommit: (name: string) => void
  onClose: () => void
}

/** A sheet that asks for one name: a new column, a new or renamed folder. */
export function NameForm({
  title,
  placeholder,
  confirmLabel,
  initial = "",
  onCommit,
  onClose,
}: IProps) {
  const [draft, setDraft] = useState(initial)

  function commit() {
    const name = draft.trim()
    if (!name) return
    if (name !== initial) onCommit(name)
    onClose()
  }

  return (
    <View>
      <SheetBar
        title={title}
        leading={{ label: "Cancel", onPress: onClose }}
        trailing={{ label: confirmLabel, onPress: commit }}
      />
      <Input
        tone="secondary"
        className="mt-2"
        value={draft}
        autoFocus
        selectTextOnFocus
        autoCapitalize="sentences"
        placeholder={placeholder}
        accessibilityLabel={placeholder}
        returnKeyType="done"
        onChangeText={setDraft}
        onSubmitEditing={commit}
      />
    </View>
  )
}
