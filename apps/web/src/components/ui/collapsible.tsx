"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CollapsibleContextType {
  open: boolean
  setOpen: (open: boolean) => void
}

const CollapsibleContext = React.createContext<CollapsibleContextType | null>(null)

const useCollapsible = () => {
  const context = React.useContext(CollapsibleContext)
  if (!context) {
    throw new Error("useCollapsible must be used within a Collapsible")
  }
  return context
}

interface CollapsibleProps {
  children: React.ReactNode
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  ({ children, defaultOpen = false, open: controlledOpen, onOpenChange, className, ...props }, ref) => {
    const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen
    
    const setOpen = React.useCallback((newOpen: boolean) => {
      if (controlledOpen === undefined) {
        setInternalOpen(newOpen)
      }
      onOpenChange?.(newOpen)
    }, [controlledOpen, onOpenChange])

    return (
      <CollapsibleContext.Provider value={{ open, setOpen }}>
        <div ref={ref} className={className} data-state={open ? "open" : "closed"} {...props}>
          {children}
        </div>
      </CollapsibleContext.Provider>
    )
  }
)
Collapsible.displayName = "Collapsible"

const CollapsibleTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, onClick, ...props }, ref) => {
  const { open, setOpen } = useCollapsible()
  
  return (
    <button
      ref={ref}
      onClick={(e) => {
        setOpen(!open)
        onClick?.(e)
      }}
      {...props}
    >
      {children}
    </button>
  )
})
CollapsibleTrigger.displayName = "CollapsibleTrigger"

const CollapsibleContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, className, ...props }, ref) => {
  const { open } = useCollapsible()
  
  return (
    <div
      ref={ref}
      className={cn(
        "overflow-hidden transition-all duration-200",
        open ? "animate-in slide-in-from-top-1" : "animate-out slide-out-to-top-1 hidden",
        className
      )}
      {...props}
    >
      {open && children}
    </div>
  )
})
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent }