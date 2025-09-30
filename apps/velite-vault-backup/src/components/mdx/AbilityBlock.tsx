interface AbilityBlockProps {
  name: string
  type?: string
  description: string
}

export function AbilityBlock({ name, type, description }: AbilityBlockProps) {
  return (
    <div className="bg-orange-50 border-l-4 border-orange-400 p-3 my-3">
      <div className="flex items-baseline gap-2">
        <h5 className="font-bold text-orange-900">{name}</h5>
        {type && <span className="text-xs italic text-orange-700">({type})</span>}
      </div>
      <p className="text-orange-800 mt-1">{description}</p>
    </div>
  )
}