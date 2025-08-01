"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
// Remove the direct import attempt if it's causing an error
// import type { PointerDownOutsideEvent } from "@radix-ui/react-dismissable-layer";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

// Infer PointerDownOutsideEvent type from DialogPrimitive.Content props
type DialogContentProps = React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Content
>;
type PointerDownOutsideEvent =
  NonNullable<DialogContentProps["onPointerDownOutside"]> extends (
    event: infer E,
  ) => void
    ? E
    : never;

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-[100] bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl data-[state=open]:animate-in  data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  DialogContentProps & {
    hideTitle?: boolean;
    hideClose?: boolean;
    title?: string;
    preventCloseOnOutsideClick?: boolean;
    preventCloseOnEscape?: boolean;
  }
>(
  (
    {
      className,
      children,
      hideTitle,
      hideClose,
      preventCloseOnOutsideClick,
      preventCloseOnEscape,
      title = "Dialog",
      ...props
    },
    ref,
  ) => {
    const handleOnPointerDownOutside = (e: PointerDownOutsideEvent) => {
      if (preventCloseOnOutsideClick) {
        e.preventDefault();
      }
    };

    const handleOnEscapeKeyDown = (e: KeyboardEvent) => {
      if (preventCloseOnEscape) {
        e.preventDefault();
      }
    };

    return (
      <DialogPortal>
        <DialogOverlay />
        {/* Fade overlay from bottom to top */}
        <div className="fixed inset-0 z-[1002] pointer-events-none bg-gradient-to-t from-white via-transparent to-transparent dark:from-zinc-950" />
        <DialogPrimitive.Content
          onPointerDownOutside={handleOnPointerDownOutside}
          onEscapeKeyDown={handleOnEscapeKeyDown}
          ref={ref}
          className={cn(
            "fixed left-[50%] top-[50%] z-[1001] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 rounded-2xl border-none bg-background/60 p-8 backdrop-blur-sm duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-down-1/2 data-[state=closed]:slide-out-to-down-[48%] data-[state=open]:slide-in-from-down-1/2 data-[state=open]:slide-in-from-top-[48%] data-[state=closed]:blur-xl",
            "before-content[''] before:absolute before:-top-[0.5px] before:left-1/2 before:h-[1px] before:w-5/6 before:-translate-x-1/2",
            "after-content[''] after:absolute after:-bottom-[0.5px] after:left-1/2 after:h-[1px] after:w-5/6 after:-translate-x-1/2",
            "before:bg-gradient-to-r before:from-transparent before:via-primary-600/80 before:to-transparent",
            "after:bg-gradient-to-r after:from-transparent after:via-primary-600/80 after:to-transparent",
            className,
          )}
          {...props}
        >
          {hideTitle ? (
            <VisuallyHidden>
              <DialogTitle>{title}</DialogTitle>
            </VisuallyHidden>
          ) : (
            <DialogTitle className="sr-only">{title}</DialogTitle>
          )}
          {children}
          {!hideClose ? (
            <DialogPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none">
              <X className="h-4 w-4 text-primary-800 hover:text-primary-900 dark:text-primary-200 dark:hover:text-primary-100" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPortal>
    );
  },
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className,
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className,
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className,
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-muted-foreground text-sm", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
