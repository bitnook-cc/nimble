import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BannerBoxProps {
  children: ReactNode
  className?: string
}

/**
 * Banner box component matching nimblerpg.com styling
 * Features a paper texture background with responsive padding
 */
export function BannerBox({ children, className }: BannerBoxProps) {
  return (
    <div
      className={cn(
        // Base styles
        "relative z-[5]",
        // Paper texture background
        "bg-[url('https://cdn.shopify.com/s/files/1/0679/1456/3753/files/PaperTexture.jpg')]",
        "bg-cover bg-center",
        // Desktop styles
        "max-w-[60%] py-8 px-0",
        // Mobile styles
        "md:max-w-[90%] md:w-auto md:mx-auto md:text-left md:p-8",
        className
      )}
    >
      {children}
    </div>
  )
}
