import { LucideIcon } from 'lucide-react'
interface Props { icon: LucideIcon; title: string; description?: string; action?: React.ReactNode }
export default function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mb-4"><Icon size={20} className="text-zinc-500"/></div>
      <h3 className="text-sm font-medium text-zinc-300 mb-1">{title}</h3>
      {description && <p className="text-xs text-zinc-500 mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  )
}
