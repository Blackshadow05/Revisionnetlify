export function MenuSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 p-6 animate-pulse">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="h-6 bg-gray-700 rounded w-24 mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-32"></div>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="h-4 bg-gray-700 rounded w-40 mb-2"></div>
            <div className="space-y-2">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="h-3 bg-gray-700 rounded w-full"></div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t border-gray-700">
            <div className="h-3 bg-gray-700 rounded w-24"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MenuCardSkeleton() {
  return (
    <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 p-6 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="h-6 bg-gray-700 rounded w-24 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-32"></div>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="h-4 bg-gray-700 rounded w-40 mb-2"></div>
        <div className="space-y-2">
          {[...Array(4)].map((_, j) => (
            <div key={j} className="h-3 bg-gray-700 rounded w-full"></div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-between items-center pt-4 border-t border-gray-700">
        <div className="h-3 bg-gray-700 rounded w-24"></div>
      </div>
    </div>
  );
}