interface SpinnerProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-4"
}

export function Spinner({ className = "", size = "md" }: SpinnerProps) {
  const sizeClass = sizeClasses[size]

  return (
    <div
      className={`inline-block animate-spin rounded-full ${sizeClass} ${className}`}
      style={{
        borderColor: 'rgb(226 232 240)',
        borderTopColor: 'rgb(37 99 235)',
      }}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}
