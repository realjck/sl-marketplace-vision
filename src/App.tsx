import { useEffect } from 'react'
import { useStore } from './store/useStore'
import Dropzone from './components/Dropzone'
import ControlBar from './components/ControlBar'
import KPICards from './components/KPICards'
import ChartArea from './components/ChartArea'

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
        <Dropzone />
        <ControlBar />
        <KPICards />
      </div>
      <ChartArea />
    </div>
  )
}
