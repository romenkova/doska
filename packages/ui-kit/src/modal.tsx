import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cn } from "./lib/cn"

function Modal({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="modal" {...props} />
}

function ModalContent({
  className,
  children,
  ...props
}: DialogPrimitive.Popup.Props) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop
        data-slot="modal-overlay"
        className={cn(
          "fixed inset-0 z-50 bg-background/40 supports-backdrop-filter:backdrop-blur-xs",
          "transition-opacity duration-200",
          "data-ending-style:opacity-0 data-starting-style:opacity-0"
        )}
      />
      <DialogPrimitive.Popup
        data-slot="modal-content"
        className={cn(
          // mobile: full-screen page
          "fixed inset-0 z-50 flex flex-col bg-popover text-sm text-popover-foreground",
          // desktop: centered modal (height is set per-state by the consumer so
          // it can transition smoothly between preview/editing)
          "md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2",
          "md:max-h-[90svh] md:w-full md:max-w-2xl md:rounded-xl md:border md:shadow-xl",
          // fade + scale on open/close, and animate the height change on resize
          "transition-all duration-200 ease-out",
          "data-ending-style:opacity-0 data-starting-style:opacity-0",
          "md:data-ending-style:scale-95 md:data-starting-style:scale-95",
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  )
}

export function ModalContentCentered({
  children,
  className,
}: React.PropsWithChildren & { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col justify-center gap-2 p-6 md:flex-none md:p-0",
        className
      )}
    >
      {children}
    </div>
  )
}

function ModalTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="modal-title"
      className={cn(
        "font-heading text-base font-medium text-foreground",
        className
      )}
      {...props}
    />
  )
}

function ModalDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="modal-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export { Modal, ModalContent, ModalTitle, ModalDescription }
