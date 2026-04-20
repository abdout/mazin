export default function Loading() {
  return (
    <div className="min-h-screen bg-primary">
      <div className="h-[60vh] md:h-[70vh] bg-gradient-to-b from-primary/50 to-primary animate-pulse" />
      <div className="px-8 py-16 space-y-12">
        <div className="h-8 w-64 bg-white/10 rounded animate-pulse" />
        <div className="h-64 bg-white/5 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-32 bg-white/5 rounded animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
