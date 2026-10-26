import React, { useRef, useState } from 'react'
import { Loader2, CheckCircle2, RefreshCw, Trash2, UploadCloud } from 'lucide-react'

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Frontend-only upload control: no file ever leaves the browser. Selecting a
// file runs a brief simulated "processing" state, then shows it as attached —
// purely to demonstrate the interaction for this prototype.
export default function UploadSlot({ label, hint, accept, icon: Icon = UploadCloud }) {
  const inputRef = useRef(null)
  const [status, setStatus] = useState('idle') // idle | uploading | done
  const [file, setFile] = useState(null)

  function handleChange(e) {
    const picked = e.target.files?.[0]
    if (!picked) return
    setFile(picked)
    setStatus('uploading')
    window.setTimeout(() => setStatus('done'), 700)
  }

  function reset() {
    setFile(null)
    setStatus('idle')
    if (inputRef.current) inputRef.current.value = ''
  }

  const isDone = status === 'done' && file

  return (
    <div
      className={`relative rounded-xl border-2 border-dashed p-4 transition-colors ${
        isDone ? 'border-growth/40 bg-growth-light/40' : 'border-slate-200 hover:border-primary-300 hover:bg-primary-50/40'
      }`}
    >
      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" id={`upload-${label}`} />

      {status === 'idle' && (
        <button onClick={() => inputRef.current?.click()} className="w-full flex items-start gap-3 text-left">
          <span className="shrink-0 w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
            <Icon size={17} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-ink">{label}</span>
            <span className="block text-xs text-slate-400 mt-0.5">{hint}</span>
          </span>
        </button>
      )}

      {status === 'uploading' && (
        <div className="flex items-center gap-3">
          <span className="shrink-0 w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
            <Loader2 size={17} className="animate-spin" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-ink truncate">{file?.name}</span>
            <span className="block text-xs text-slate-400 mt-0.5">Uploading…</span>
          </span>
        </div>
      )}

      {isDone && (
        <div className="flex items-start gap-3">
          <span className="shrink-0 w-9 h-9 rounded-lg bg-growth text-white flex items-center justify-center">
            <CheckCircle2 size={17} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-ink truncate">{file.name}</span>
            <span className="block text-xs text-growth-dark mt-0.5">{formatBytes(file.size)} · Uploaded</span>
          </span>
          <span className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => inputRef.current?.click()}
              title="Replace file"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary-600 hover:bg-white transition-colors"
            >
              <RefreshCw size={13} />
            </button>
            <button
              onClick={reset}
              title="Remove file"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-danger hover:bg-white transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </span>
        </div>
      )}
    </div>
  )
}
