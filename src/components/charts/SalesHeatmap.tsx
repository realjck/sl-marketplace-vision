import { useMemo, Fragment } from 'react'
import { useStore } from '../../store/useStore'
import { buildHeatmap } from '../../lib/computeKPIs'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

export default function SalesHeatmap() {
  const filteredTransactions = useStore(s => s.filteredTransactions)
  const cells = useMemo(() => buildHeatmap(filteredTransactions), [filteredTransactions])

  const maxVolume = Math.max(...cells.map(c => c.volume), 1)

  function getColor(volume: number): string {
    const intensity = Math.round((volume / maxVolume) * 200 + 55)
    return `rgba(59, 130, 246, ${(intensity / 255).toFixed(2)})`
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div
        className="inline-grid gap-0.5 min-w-full"
        style={{ gridTemplateColumns: `44px repeat(24, minmax(20px, 1fr))` }}
      >
        <div />
        {HOURS.map(h => (
          <div key={h} className="text-center text-xs text-slate-600 pb-1 leading-none">
            {h}
          </div>
        ))}

        {DAYS.map((day, dayIdx) => (
          <Fragment key={day}>
            <div className="text-xs text-slate-500 flex items-center pr-2 leading-none">
              {day}
            </div>
            {HOURS.map(hour => {
              const cell = cells[dayIdx * 24 + hour]
              const vol = cell?.volume ?? 0
              return (
                <div
                  key={`${dayIdx}-${hour}`}
                  title={`${day} ${hour}:00 — ${vol} sale${vol !== 1 ? 's' : ''}`}
                  className="aspect-square rounded-sm"
                  style={{ background: vol > 0 ? getColor(vol) : '#121f12' }}
                />
              )
            })}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
