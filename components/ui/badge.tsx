import * as React from "react"
import { cn } from "@/lib/utils"

// Definisi varian style untuk Badge
// Kita gunakan manual object mapping agar ringan tanpa library tambahan
const badgeVariants = {
  default: "border-transparent bg-slate-900 text-slate-50 hover:bg-slate-900/80",
  secondary: "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-100/80",
  destructive: "border-transparent bg-red-500 text-slate-50 hover:bg-red-500/80", // Untuk status Banned
  outline: "text-slate-950 border-slate-200",
  success: "border-transparent bg-green-600 text-white hover:bg-green-600/80", // Untuk status Aktif/Aman
  warning: "border-transparent bg-yellow-500 text-white hover:bg-yellow-500/80", // Untuk warning/expired soon
  info: "border-transparent bg-blue-500 text-white hover:bg-blue-500/80", // Untuk info umum
}

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof badgeVariants
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2",
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }