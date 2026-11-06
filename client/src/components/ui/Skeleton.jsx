// client/src/components/ui/Skeleton.jsx
export default function Skeleton({
  className = "",
  width = "100%",
  height = "1rem",
  rounded = "rounded-xl",
}) {
  return (
    <div
      style={{ width, height }}
      className={`animate-pulse bg-white/[0.06] ${rounded} ${className}`}
      aria-hidden="true"
    />
  );
}

export function CardSkeleton({ lines = 3, className = "" }) {
  return (
    <div className={`p-5 rounded-2xl bg-[#0e1422] border border-white/[0.08] space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton width="40%" height="1.25rem" />
        <Skeleton width="20%" height="1rem" rounded="rounded-full" />
      </div>
      <Skeleton width="60%" height="2rem" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={`${85 - i * 15}%`} height="0.875rem" />
      ))}
    </div>
  );
}
