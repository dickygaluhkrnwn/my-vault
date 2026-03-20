"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { theme } = useTheme();

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-500 border",
        theme === 'hacker' ? "bg-[#050505] border-green-900/50 shadow-[0_0_15px_rgba(34,197,94,0.05)] text-green-500 font-mono rounded-sm" : 
        theme === 'casual' ? "bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border-orange-200 dark:border-stone-800 shadow-xl shadow-orange-900/5 text-stone-800 dark:text-stone-100 rounded-[2rem]" : 
        "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm text-slate-900 dark:text-slate-100 rounded-2xl font-sans",
        className
      )}
      {...props}
    />
  );
})
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-4 md:p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  const { theme } = useTheme();
  return (
    <h3
      ref={ref}
      className={cn(
        "text-xl md:text-2xl font-semibold leading-none tracking-tight transition-colors",
        theme === 'hacker' ? 'uppercase tracking-widest text-green-400' : '',
        className
      )}
      {...props}
    />
  );
})
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { theme } = useTheme();
  return (
    <p
      ref={ref}
      className={cn(
        "text-xs md:text-sm transition-colors", 
        theme === 'hacker' ? 'text-green-700' : 'text-slate-500 dark:text-slate-400',
        theme === 'casual' ? 'text-stone-500' : '',
        className
      )}
      {...props}
    />
  );
})
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 md:p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-4 md:p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }