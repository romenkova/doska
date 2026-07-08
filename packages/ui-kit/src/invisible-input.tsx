import { cn } from "./lib/cn"

interface IProps extends React.ComponentProps<"input"> {
  isPreview?: boolean
}

export function InvisibleInput({ className, isPreview, ...props }: IProps) {
  return (
    <input
      {...props}
      readOnly={isPreview}
      className={cn(
        className,
        "bg-transparent outline-none",
        "placeholder:text-muted-foreground/50",
        "px-2 py-0.5 focus-within:bg-secondary",
        "rounded-sm bg-secondary outline-none"
      )}
    />
  )
}
