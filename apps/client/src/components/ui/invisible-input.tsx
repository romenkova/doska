import { cn } from "@/lib/utils"

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
        "w-full resize-none bg-transparent outline-none",
        "placeholder:text-muted-foreground/50"
      )}
    />
  )
}
