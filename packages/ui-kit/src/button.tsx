import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { type VariantProps } from "class-variance-authority"
import { cn } from "./lib/cn"
import { buttonVariants } from "./button-variants"
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip"

type TProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    tooltip?: boolean
  }

function Button({
  className,
  variant = "default",
  size = "default",
  tooltip = true,
  ...props
}: TProps) {
  const button = (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )

  if (!tooltip || !props["aria-label"]) return button

  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent>{props["aria-label"]}</TooltipContent>
    </Tooltip>
  )
}

export { Button }
