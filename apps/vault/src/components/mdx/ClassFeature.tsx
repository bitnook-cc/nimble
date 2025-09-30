interface ClassFeatureProps {
  name: string
  description: string
  keyAttribute: string
  hitDie: string
  features: string[]
}

export function ClassFeature({ name, description, keyAttribute, hitDie, features }: ClassFeatureProps) {
  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 my-4">
      <h4 className="text-xl font-bold text-blue-900 mb-2">{name}</h4>
      <p className="text-blue-800 mb-3">{description}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mb-3">
        <div><strong>Key Attribute:</strong> {keyAttribute}</div>
        <div><strong>Hit Die:</strong> {hitDie}</div>
      </div>
      
      <div>
        <strong className="text-blue-900">Key Features:</strong>
        <ul className="list-disc list-inside text-blue-800 mt-1">
          {features.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}