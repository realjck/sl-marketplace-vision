import { useState } from 'react'
import { useStore } from '../store/useStore'

interface Props {
  open: boolean
  onClose: () => void
}

export default function PreferencesModal({ open, onClose }: Props) {
  const [confirming, setConfirming] = useState(false)
  const resetData = useStore(s => s.resetData)

  async function handleReset() {
    await resetData()
    setConfirming(false)
    onClose()
  }

  function handleClose() {
    setConfirming(false)
    onClose()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={handleClose}
    >
      <div
        className="bg-[#0b130b] rounded-xl p-6 w-80 shadow-2xl border border-[#1a3a1a]"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-[#00e676] mb-4">Preferences</h2>

        {!confirming ? (
          <>
            <button
              onClick={() => setConfirming(true)}
              className="w-full bg-red-950 border border-red-800 text-red-400 rounded-lg px-4 py-2.5 text-sm hover:bg-red-900 transition-colors"
            >
              Reset Data
            </button>
            <button
              onClick={handleClose}
              className="w-full mt-2 text-[#3a6a3a] text-sm py-2 hover:text-[#00e676] transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-[#7a9e7a] mb-4">
              This will permanently delete all imported transaction data. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 bg-[#070d07] border border-[#1a3a1a] text-[#3a6a3a] rounded-lg px-4 py-2 text-sm hover:border-[#00e676]/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex-1 bg-red-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-red-700 transition-colors"
              >
                Confirm Reset
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
