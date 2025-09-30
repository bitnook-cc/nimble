interface LocationCardProps {
  name: string
  type: string
  description: string
  notableFeatures: string[]
  dangerLevel: string
}

export function LocationCard({ name, type, description, notableFeatures, dangerLevel }: LocationCardProps) {
  const getDangerColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return 'text-green-700 bg-green-100'
      case 'low to moderate': return 'text-yellow-700 bg-yellow-100'
      case 'moderate': return 'text-orange-700 bg-orange-100'
      case 'high': return 'text-red-700 bg-red-100'
      case 'extreme': return 'text-purple-700 bg-purple-100'
      default: return 'text-gray-700 bg-gray-100'
    }
  }

  return (
    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 my-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="text-xl font-bold text-green-900">{name}</h4>
          <p className="text-green-700 italic">{type}</p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-semibold ${getDangerColor(dangerLevel)}`}>
          {dangerLevel} Danger
        </span>
      </div>
      
      <p className="text-green-800 mb-3">{description}</p>
      
      <div>
        <strong className="text-green-900">Notable Features:</strong>
        <ul className="list-disc list-inside text-green-800 mt-1">
          {notableFeatures.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}