"use client"

import { cn } from "@/lib/utils"

function Field({ className, children, ...props }: React.HTMLProps<HTMLDivElement>) {
  return <div className={cn("grid gap-1.5", className)} {...props} />
}

function FieldLabel({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium", className)} {...props} />
}

function FieldContent({ className, children, ...props }: React.HTMLProps<HTMLDivElement>) {
  return <div className={cn("", className)} {...props} />
}

function FieldDescription({ className, children, ...props }: React.HTMLProps<HTMLParagraphElement>) {
  return <p className={cn("text-xs text-muted-foreground", className)} {...props} />
}

function FieldGroup({ className, children, ...props }: React.HTMLProps<HTMLDivElement>) {
  return <div className={cn("grid gap-4", className)} {...props} />
}

function FieldSeparator({ className, ...props }: React.HTMLProps<HTMLHrElement>) {
  return <hr className={cn("border-border", className)} {...props} />
}

export { Field, FieldLabel, FieldContent, FieldDescription, FieldGroup, FieldSeparator }