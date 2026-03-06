import { useEffect } from 'react'
import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react'
import { useUiStore } from '../../stores/uiStore'

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const colors = {
  success: 'border-emerald-500 bg-emerald-500/10 text-emerald-400',
  error: 'border-red-500 bg-red-500/10 text-red-400',
  warning: 'border-amber-500 bg-amber-500/10 text-amber-400',
  info: 'border-indigo-500 bg-indigo-500/10 text-indigo-400',
}

function Toast({ toast }) {
  const { removeToast } = useUiStore()
  const Icon = icons[toast.type] || icons.info
  const color = colors[toast.type] || colors.info

  useEffect(() => {
    const timer = setTimeout(() => removeToast(toast.id), toast.duration)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, removeToast])

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-sm ${color} animate-slide-in`}>
      <Icon size={16} className="mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        {toast.title && <div className="text-xs font-semibold">{toast.title}</div>}
        {toast.message && <div className="text-xs opacity-80 mt-0.5">{toast.message}</div>}
      </div>
      <button onClick={() => removeToast(toast.id)} className="shrink-0 opacity-50 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  )
}

export default function ToastContainer() {
  const { toasts } = useUiStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-80">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  )
}
