import type { Toast } from '../../types'

interface ToastItemProps {
  toast: Toast
  onClose: (id: string) => void
}

/** Individual toast notification item */
function ToastItem({ toast, onClose }: ToastItemProps) {
  const borderColor = {
    success: 'border-[#00ff88]',
    error: 'border-[#ff3333]',
    info: 'border-[#d4ff00]'
  }[toast.type]

  const iconColor = {
    success: 'text-[#00ff88]',
    error: 'text-[#ff3333]',
    info: 'text-[#d4ff00]'
  }[toast.type]

  const icon = {
    success: '✓',
    error: '✗',
    info: 'ℹ'
  }[toast.type]

  return (
    <div
      className={`bg-[#1a1a1a] border-[3px] ${borderColor} p-4 flex items-start gap-3 animate-slide-in-right font-mono`}
      style={{ minWidth: '300px', maxWidth: '400px' }}
    >
      <span className={`${iconColor} text-lg font-bold shrink-0`}>{icon}</span>
      <p className="text-[#f5f5f0] text-sm flex-1 break-words">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="text-[#f5f5f0]/50 hover:text-[#f5f5f0] text-lg leading-none shrink-0 border-none bg-transparent cursor-pointer"
      >
        ×
      </button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onClose: (id: string) => void
}

/** Container for displaying toast notifications */
export function Toast({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  )
}
