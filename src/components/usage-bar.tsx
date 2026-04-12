interface UsageBarProps {
  label: string
  current: number
  limit: number | null  // null = unlimited
}

export function UsageBar({ label, current, limit }: UsageBarProps) {
  if (limit === null) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">{label}</span>
          <span className="text-slate-300 font-medium">{current} (Ilimitado)</span>
        </div>
        <div className="h-2 rounded-full bg-slate-800" />
      </div>
    )
  }

  const percentage = limit === 0 ? 100 : Math.min(Math.round((current / limit) * 100), 100)

  const barColor =
    percentage >= 100 ? 'bg-red-500' :
    percentage >= 80  ? 'bg-yellow-400' :
    'bg-cyan-500'

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300 font-medium">
          {current} / {limit}
          <span className="text-slate-500 ml-2 text-xs">{percentage}%</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
