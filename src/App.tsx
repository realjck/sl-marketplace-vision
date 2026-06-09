import { useEffect } from 'react'
import { useStore } from './store/useStore'

export default function App() {
  const loadFromDB = useStore(s => s.loadFromDB)

  useEffect(() => {
    loadFromDB()
  }, [loadFromDB])

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 p-4 flex flex-col gap-3">
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: '180px 1fr 280px' }}
      >
        <div className="border-2 border-dashed border-slate-700 rounded-xl h-52 flex items-center justify-center text-slate-600 text-xs">
          Dropzone
        </div>
        <div className="bg-[#0f172a] rounded-xl h-52 flex items-center justify-center text-slate-600 text-xs">
          Controls
        </div>
        <div className="bg-[#0f172a] rounded-xl h-52 flex items-center justify-center text-slate-600 text-xs">
          KPIs
        </div>
      </div>
      <div className="bg-[#0f172a] rounded-xl p-4 flex-1 min-h-80 flex items-center justify-center text-slate-600 text-xs">
        Charts
      </div>
    </div>
  )
}
