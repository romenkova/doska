interface IProps {
  label: string
  board?: string
}

export function HistoryChip({ label, board }: IProps) {
  return (
    <span className="inline-flex max-w-40 items-center gap-1 rounded-md border border-border bg-muted px-1.5 text-xs leading-5 text-foreground">
      {board && (
        <span className="truncate text-muted-foreground">{board} /</span>
      )}
      <span className="truncate">{label}</span>
    </span>
  )
}
