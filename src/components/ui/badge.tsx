import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline"
}

function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100",
    outline: "border border-gray-300 dark:border-gray-600"
  }
  
  return (
    <div
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${variantStyles[variant]} ${className}`}
      {...props}
    />
  )
}

export { Badge }

