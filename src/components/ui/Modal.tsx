import { X } from 'lucide-react'
import { useEffect } from 'react'
import clsx from 'clsx'

interface Props { open: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'sm'|'md'|'lg' }
export default function Modal({ open, onClose, title, children, size = 'md' }: Props) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx('relative card w-full animate-fade-in', size==='sm'&&'max-w-md', size==='md'&&'max-w-lg', size==='lg'&&'max-w-2xl')}>
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="font-semibold text-zinc-100 text-sm">{title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300"><X size={15}/></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
