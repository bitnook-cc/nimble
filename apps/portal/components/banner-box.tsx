import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BannerBoxProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

/**
 * Banner box component matching nimblerpg.com styling
 * Features a paper texture background with decorative corner images
 */
export function BannerBox({ children, className, onClick }: BannerBoxProps) {
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
        // Rounded corners and shadow
        "rounded-[4px] shadow-[0_4px_7px_rgba(0,0,0,0.4)]",
        className
      )}
      onClick={onClick}
    >
      {/* Corner decorations */}
      <span
        className="absolute top-[10px] left-[10px] w-[130px] h-[130px] bg-[url('/corner.png')] bg-contain bg-no-repeat"
        style={{ transform: 'rotate(0deg)' }}
      />
      <span
        className="absolute top-[10px] right-[10px] w-[130px] h-[130px] bg-[url('/corner.png')] bg-contain bg-no-repeat"
        style={{ transform: 'rotate(90deg)' }}
      />
      <span
        className="absolute bottom-[10px] left-[10px] w-[130px] h-[130px] bg-[url('/corner.png')] bg-contain bg-no-repeat"
        style={{ transform: 'rotate(270deg)' }}
      />
      <span
        className="absolute bottom-[10px] right-[10px] w-[130px] h-[130px] bg-[url('/corner.png')] bg-contain bg-no-repeat"
        style={{ transform: 'rotate(180deg)' }}
      />

      {children}
    </div>
  )
}
