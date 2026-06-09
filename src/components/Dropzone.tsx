import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useStore } from '../store/useStore'
import { parseCSV } from '../lib/csvParser'
import { getExistingOrderIds, insertTransactions } from '../db/database'

export default function Dropzone() {
  const setImportStatus = useStore(s => s.setImportStatus)
  const loadFromDB = useStore(s => s.loadFromDB)
  const importStatus = useStore(s => s.importStatus)

  const onDrop = useCallback(
    async (files: File[]) => {
      setImportStatus({ state: 'loading', message: 'Importing...', count: 0 })

      let totalImported = 0
      const errors: string[] = []

      for (const file of files) {
        const content = await file.text()
        const existingIds = await getExistingOrderIds()
        const result = parseCSV(content, existingIds)

        if (result.errors.length > 0) {
          errors.push(`${file.name}: ${result.errors.join(', ')}`)
          continue
        }

        await insertTransactions(result.transactions)
        totalImported += result.transactions.length
      }

      if (errors.length > 0) {
        setImportStatus({ state: 'error', message: errors.join(' | '), count: totalImported })
      } else {
        setImportStatus({
          state: 'success',
          message: `${totalImported} transaction${totalImported !== 1 ? 's' : ''} loaded`,
          count: totalImported,
        })
      }

      await loadFromDB()
    },
    [setImportStatus, loadFromDB],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: true,
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer bg-[#070d07] transition-colors min-h-52 ${
        isDragActive ? 'border-[#00e676] bg-[#00e676]/5' : 'border-[#1a3a1a] hover:border-[#00e676]/50'
      }`}
    >
      <input {...getInputProps()} />
      <svg
        className="w-8 h-8 text-[#3a6a3a]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <p className="text-xs text-[#3a6a3a] text-center leading-relaxed px-3">
        Drag & Drop
        <br />
        Linden Lab
        <br />
        Transactions (CSV)
      </p>
      {importStatus.state !== 'idle' && (
        <p
          className={`text-xs text-center px-3 mt-1 leading-tight ${
            importStatus.state === 'error' ? 'text-red-400' : 'text-[#00e676]/70'
          }`}
        >
          {importStatus.message}
        </p>
      )}
    </div>
  )
}
