import * as React from "react"
import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value?: number | null, indicatorColor?: string }
>(({ className, value, indicatorColor, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800", // h-2 sudah cukup baik untuk mobile
      className
    )}
    {...props}
  >
    <div
      className={cn(
        "h-full w-full flex-1 transition-all duration-500 ease-in-out", // Animasi halus
        indicatorColor || "bg-blue-600"
      )}
      style={{ transform: `translateX(-${100 - (Math.min(100, Math.max(0, value || 0)))}%)` }}
    />
  </div>
))
Progress.displayName = "Progress"

export { Progress }