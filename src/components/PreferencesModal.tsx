import { useState } from 'react'
import { useStore } from '../store/useStore'

export default function PreferencesModal() {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const resetData = useStore(s => s.resetData)

  async function handleReset() {
    await resetData()
    setConfirming(false)
    setOpen(false)
  }

  function handleClose() {
    setConfirming(false)
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 bg-[#0d1520] border border-[#1a3a1a] rounded-lg px-3 py-2 text-sm text-[#3a6a3a] hover:text-[#00e676] hover:border-[#00e676]/50 flex items-center gap-2 transition-colors z-40"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        Preferences
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={handleClose}
        >
          <div
            className="bg-[#0d1520] rounded-xl p-6 w-80 shadow-2xl border border-[#1a3a1a]"
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
                  className="w-full mt-2 text-slate-500 text-sm py-2 hover:text-slate-300 transition-colors"
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
                    className="flex-1 bg-[#080d14] border border-[#1a3a1a] text-[#3a6a3a] rounded-lg px-4 py-2 text-sm hover:border-[#00e676]/50 transition-colors"
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
      )}
    </>
  )
}
