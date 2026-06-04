interface Props { title: string; description?: string; actions?: React.ReactNode }
export default function PageHeader({ title, description, actions }: Props) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-surface-900/50 sticky top-0 z-10 backdrop-blur-sm">
      <div>
        <h1 className="font-semibold text-zinc-100 text-base">{title}</h1>
        {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
