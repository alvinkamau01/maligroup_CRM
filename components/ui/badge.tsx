import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Matches the UxSculpt design system Badge: intent x style x size x shape.
const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center overflow-hidden border border-transparent whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        // Design-system intents
        neutral: "bg-transparent text-foreground",
        success: "bg-success-muted text-success-strong",
        "success-outline": "border-success-border text-success-strong",
        error: "bg-error-muted text-error-strong",
        "error-outline": "border-error-border text-error-strong",
        // Legacy/shadcn intents retained for existing usage
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-error-muted text-error-strong focus-visible:ring-destructive/20 [a]:hover:bg-error-muted/70",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-5 gap-1 px-2 py-0.5 text-[11px] leading-4 font-normal",
        md: "h-6 gap-1 px-2 py-1 text-xs leading-4 font-semibold",
        lg: "h-7 gap-1 px-3 py-1.5 text-sm leading-5 font-semibold",
      },
      shape: {
        rounded: "rounded-sm",
        pill: "rounded-full",
        square: "rounded-none",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      shape: "rounded",
    },
  }
)

function Badge({
  className,
  variant = "default",
  size = "md",
  shape = "rounded",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant, size, shape }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
      size,
      shape,
    },
  })
}

export { Badge, badgeVariants }
