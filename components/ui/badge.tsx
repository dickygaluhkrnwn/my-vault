"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const { theme } = useTheme();

  // Base styles yang selalu dipakai di semua tema
  const baseStyles = "inline-flex items-center px-2.5 py-0.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 whitespace-nowrap";
  
  let themeStyles = "";
  let variantStyles = "";

  // --- HACKER THEME ---
  if (theme === 'hacker') {
    themeStyles = "font-mono uppercase tracking-wider rounded-sm border";
    switch(variant) {
      case 'default': variantStyles = "bg-black text-green-500 border-green-900/50 hover:bg-green-900/20"; break;
      case 'secondary': variantStyles = "bg-green-900/20 text-green-400 border-green-500/50 hover:bg-green-900/40"; break;
      case 'destructive': variantStyles = "bg-red-950/30 text-red-500 border-red-900/50 hover:bg-red-900/40 animate-pulse"; break;
      case 'success': variantStyles = "bg-emerald-950/30 text-emerald-400 border-emerald-900/50 hover:bg-emerald-900/40"; break;
      case 'warning': variantStyles = "bg-amber-950/30 text-amber-500 border-amber-900/50 hover:bg-amber-900/40"; break;
      case 'info': variantStyles = "bg-cyan-950/30 text-cyan-400 border-cyan-900/50 hover:bg-cyan-900/40"; break;
      case 'outline': variantStyles = "bg-transparent text-green-600 border-green-900/50 hover:border-green-500"; break;
    }
  } 
  // --- CASUAL THEME ---
  else if (theme === 'casual') {
    themeStyles = "rounded-xl border shadow-sm";
    switch(variant) {
      case 'default': variantStyles = "bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 hover:opacity-80 border-transparent"; break;
      case 'secondary': variantStyles = "bg-orange-100 text-orange-700 dark:bg-stone-800 dark:text-orange-400 hover:opacity-80 border-orange-200 dark:border-stone-700"; break;
      case 'destructive': variantStyles = "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-200"; break;
      case 'success': variantStyles = "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-200"; break;
      case 'warning': variantStyles = "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-200"; break;
      case 'info': variantStyles = "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-200"; break;
      case 'outline': variantStyles = "bg-transparent text-stone-700 dark:text-stone-300 border-orange-200 dark:border-stone-700 hover:bg-orange-50 dark:hover:bg-stone-800"; break;
    }
  } 
  // --- FORMAL THEME ---
  else {
    themeStyles = "rounded-full border";
    switch(variant) {
      case 'default': variantStyles = "bg-slate-900 text-slate-50 border-transparent hover:bg-slate-900/80 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/80"; break;
      case 'secondary': variantStyles = "bg-slate-100 text-slate-900 border-transparent hover:bg-slate-100/80 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-800/80"; break;
      case 'destructive': variantStyles = "bg-red-500 text-slate-50 border-transparent hover:bg-red-500/80"; break;
      case 'success': variantStyles = "bg-emerald-500 text-white border-transparent hover:bg-emerald-600"; break;
      case 'warning': variantStyles = "bg-amber-500 text-white border-transparent hover:bg-amber-600"; break;
      case 'info': variantStyles = "bg-blue-500 text-white border-transparent hover:bg-blue-600"; break;
      case 'outline': variantStyles = "bg-transparent text-slate-950 dark:text-slate-50 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"; break;
    }
  }

  return (
    <div
      className={cn(baseStyles, themeStyles, variantStyles, className)}
      {...props}
    />
  )
}

export { Badge }