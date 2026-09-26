"use client"

import { cn } from "@/lib/utils"

function InputGroup({ className, children, ...props }: React.HTMLProps<HTMLDivElement>) {
  return (
    <div className={cn("flex w-full items-center border border-input bg-background rounded-md", className)} {...props}>
      {children}
    </div>
  )
}

function InputGroupAddon({ className, children, ...props }: React.HTMLProps<HTMLDivElement>) {
  return <div className={cn("flex items-center px-3 text-muted-foreground", className)} {...props} />
}

function InputGroupText({ className, children, ...props }: React.HTMLProps<HTMLSpanElement>) {
  return <span className={cn("", className)} {...props} />
}

interface InputGroupInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

function InputGroupInput({ className, ...props }: InputGroupInputProps) {
  return (
    <input
      className={cn("flex h-10 w-full bg-transparent py-0 pr-3 text-foreground placeholder:text-muted-foreground border-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50", className)}
      {...props}
    />
  )
}

export { InputGroup, InputGroupAddon, InputGroupText, InputGroupInput }