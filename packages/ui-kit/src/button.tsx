import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { type VariantProps } from "class-variance-authority"
import { cn } from "./lib/cn"
import { buttonVariants } from "./button-variants"
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip"

type TProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    /** A string replaces the `aria-label` as the tooltip text. */
    tooltip?: boolean | string
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

  const label = typeof tooltip === "string" ? tooltip : props["aria-label"]
  if (!tooltip || !label) return button

  return (
    <Tooltip key={props.disabled ? "disabled" : "enabled"}>
      {props.disabled ? (
        <TooltipTrigger render={<span className="inline-flex" />}>
          {button}
        </TooltipTrigger>
      ) : (
        <TooltipTrigger render={button} />
      )}
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export { Button }
