"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"

const Progress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value?: number | null, indicatorColor?: string }
>(({ className, value, indicatorColor, ...props }, ref) => {
  const { theme } = useTheme();

  // Gaya untuk latar belakang track progress bar
  const trackStyles = {
    formal: "rounded-full bg-slate-200 dark:bg-slate-800",
    hacker: "rounded-sm bg-[#020202] border border-green-900/50",
    casual: "rounded-full bg-orange-100 dark:bg-stone-800",
  };

  // Gaya default untuk warna indikator yang berjalan
  const defaultIndicatorStyles = {
    formal: "bg-blue-600",
    hacker: "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]",
    casual: "bg-gradient-to-r from-orange-500 to-pink-500",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden transition-colors duration-500",
        trackStyles[theme] || trackStyles.formal,
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "h-full w-full flex-1 transition-all duration-500 ease-in-out",
          indicatorColor || defaultIndicatorStyles[theme] || defaultIndicatorStyles.formal
        )}
        style={{ transform: `translateX(-${100 - (Math.min(100, Math.max(0, value || 0)))}%)` }}
      />
    </div>
  )
})
Progress.displayName = "Progress"

export { Progress }