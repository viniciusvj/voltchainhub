export function LoadingCard() {
  return (
    <div className="animate-pulse rounded-xl bg-volt-dark-800 border border-volt-dark-600 p-5 space-y-3">
      {/* Title placeholder */}
      <div className="h-4 bg-volt-dark-600 rounded-md w-2/5" />
      {/* Subtitle placeholder */}
      <div className="h-3 bg-volt-dark-700 rounded-md w-3/5" />
      {/* Content lines */}
      <div className="space-y-2 pt-2">
        <div className="h-3 bg-volt-dark-700 rounded-md w-full" />
        <div className="h-3 bg-volt-dark-700 rounded-md w-4/5" />
        <div className="h-3 bg-volt-dark-700 rounded-md w-3/5" />
      </div>
      {/* Bottom bar placeholder */}
      <div className="h-8 bg-volt-dark-600 rounded-lg w-1/3 mt-4" />
    </div>
  );
}

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-[3px]',
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full border-volt-dark-600 border-t-[#0066FF] animate-spin`}
      role="status"
      aria-label="Carregando..."
    />
  );
}

export function PageLoading() {
  return (
    <div className="w-full space-y-6" aria-busy="true" aria-label="Carregando página...">
      {/* Page title skeleton */}
      <div className="animate-pulse space-y-2">
        <div className="h-7 bg-volt-dark-700 rounded-lg w-48" />
        <div className="h-4 bg-volt-dark-800 rounded-md w-72" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl bg-volt-dark-800 border border-volt-dark-600 p-4 space-y-2"
          >
            <div className="h-3 bg-volt-dark-700 rounded w-3/4" />
            <div className="h-7 bg-volt-dark-600 rounded-md w-1/2" />
          </div>
        ))}
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <LoadingCard key={i} />
        ))}
      </div>
    </div>
  );
}
