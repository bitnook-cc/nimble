'use client'

import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToolCardProps {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  status: 'available' | 'coming-soon' | 'placeholder'
  tags?: string[]
  onClick?: () => void
}

export function ToolCard({
  title,
  description,
  icon,
  status,
  tags,
  onClick
}: ToolCardProps) {
  const isClickable = status === 'available'

  return (
    <button
      onClick={onClick}
      disabled={!isClickable}
      aria-label={`${title} - ${status === 'available' ? 'Open tool' : `Status: ${status.replace('-', ' ')}`}`}
      className={cn(
        "w-full text-left bg-white rounded-lg shadow-sm border border-slate-200 p-6",
        "transition-all duration-200",
        isClickable && "hover:shadow-md hover:border-slate-300 cursor-pointer",
        !isClickable && "opacity-75 cursor-not-allowed"
      )}
    >
      {/* Icon + Title + Status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
            {icon}
          </div>
          <h3 className="text-lg font-semibold text-slate-900">
            {title}
          </h3>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Description */}
      <p className="text-slate-600 mb-4 text-sm">
        {description}
      </p>

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {tags.map(tag => (
            <span
              key={tag}
              className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-600"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* CTA */}
      {isClickable && (
        <div className="flex items-center text-sm text-primary font-medium">
          Open Tool
          <ChevronRight className="w-4 h-4 ml-1" aria-hidden="true" />
        </div>
      )}
    </button>
  )
}

function StatusBadge({ status }: { status: string }) {
  const variants = {
    'available': 'bg-green-50 text-green-700 border-green-200',
    'coming-soon': 'bg-amber-50 text-amber-900 border-amber-200',
    'placeholder': 'bg-slate-50 text-slate-600 border-slate-200'
  }

  return (
    <span className={cn(
      "px-3 py-1 text-xs font-medium rounded-full border",
      variants[status as keyof typeof variants]
    )}>
      {status === 'available' && '✓ Ready'}
      {status === 'coming-soon' && 'Coming Soon'}
      {status === 'placeholder' && 'Planned'}
    </span>
  )
}
