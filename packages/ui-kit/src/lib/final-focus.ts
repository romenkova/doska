type CloseType = "mouse" | "touch" | "pen" | "keyboard" | ""

export function focusTriggerOnKeyboardClose(closeType: CloseType): boolean {
  return closeType === "keyboard"
}
