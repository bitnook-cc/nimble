interface WorldMapProps {
  regions: string[]
}

export function WorldMap({ regions }: WorldMapProps) {
  return (
    <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-6 my-4">
      <h4 className="text-xl font-bold text-indigo-900 mb-4 text-center">World Overview</h4>
      
      <div className="relative bg-indigo-100 rounded-lg p-4 min-h-48">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-6xl text-indigo-300">🗺️</div>
        </div>
        
        <div className="relative z-10 grid grid-cols-2 gap-4">
          {regions.map((region, index) => (
            <div 
              key={index}
              className="bg-white/80 backdrop-blur-sm rounded border border-indigo-300 p-2 text-center text-sm font-medium text-indigo-900"
            >
              {region}
            </div>
          ))}
        </div>
      </div>
      
      <p className="text-indigo-700 text-center mt-3 italic">
        Interactive map coming soon! For now, explore each region in the detailed gazetteer.
      </p>
    </div>
  )
}