import { getResidente, getResidenciasConHabitaciones } from '@/app/actions/residentes'
import { PageHeader } from '@/components/shared/PageHeader'
import { ResidenteForm } from '@/components/forms/ResidenteForm'
import { notFound } from 'next/navigation'

export default async function EditarResidentePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params
  const id = parseInt(idStr)

  if (isNaN(id)) notFound()

  const [residente, residencias] = await Promise.all([
    getResidente(id),
    getResidenciasConHabitaciones()
  ])

  if (!residente) notFound()

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title={`Editar Residente: ${residente.user.nombre}`}
        description="Actualiza la información del perfil o el acceso del residente."
      />

      <ResidenteForm residencias={residencias} initialData={residente} />
    </div>
  )
}
