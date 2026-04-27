type StatusVariant =
  | 'LIBRE' | 'OCUPADO' | 'SOLICITADO'
  | 'PENDIENTE' | 'PARCIAL' | 'PAGADO'
  | 'APROBADO' | 'RECHAZADO'
  | 'ACTIVA' | 'INACTIVA'
  | 'RESERVADO' | 'POR_LIBERARSE'

const variantMap: Record<StatusVariant, { label: string; classes: string }> = {
  LIBRE:      { label: 'Libre',      classes: 'bg-green-100 text-green-800' },
  OCUPADO:    { label: 'Ocupado',    classes: 'bg-red-100 text-red-800' },
  SOLICITADO: { label: 'Solicitado', classes: 'bg-yellow-100 text-yellow-800' },
  PENDIENTE:  { label: 'Por Pagar',  classes: 'bg-yellow-100 text-yellow-800' },
  EN_REVISION: { label: 'Revisión',   classes: 'bg-blue-100 text-blue-800' },
  PARCIAL:    { label: 'Parcial',    classes: 'bg-orange-100 text-orange-800' },
  PAGADO:     { label: 'Pagado',     classes: 'bg-green-100 text-green-800' },
  APROBADO:   { label: 'Aprobado',   classes: 'bg-green-100 text-green-800' },
  RECHAZADO:  { label: 'Rechazado',  classes: 'bg-red-100 text-red-800' },
  ACTIVA:     { label: 'Activa',     classes: 'bg-green-100 text-green-800' },
  INACTIVA:   { label: 'Inactiva',   classes: 'bg-gray-100 text-gray-600' },
  RESERVADO:  { label: 'Reservado',  classes: 'bg-orange-100 text-orange-800' },
  POR_LIBERARSE: { label: 'Por Liberar', classes: 'bg-purple-100 text-purple-800' },
}

export function StatusBadge({ status }: { status: StatusVariant }) {
  const { label, classes } = variantMap[status] ?? { label: status, classes: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${classes}`}>
      {label}
    </span>
  )
}
