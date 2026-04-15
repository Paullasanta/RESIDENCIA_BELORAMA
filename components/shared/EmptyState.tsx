interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-4 text-gray-300">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-500">{title}</h3>
      {description && <p className="text-sm text-gray-400 mt-1 max-w-sm">{description}</p>}
    </div>
  )
}
