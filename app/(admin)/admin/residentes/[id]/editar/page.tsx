import { getResidente, getResidenciasConHabitaciones } from '@/app/actions/residentes'
import { PageHeader } from '@/components/shared/PageHeader'
import { ResidenteForm } from '@/components/forms/ResidenteForm'
import { notFound } from 'next/navigation'

interface EditarResidentePageProps {
  params: Promise<{ id: string }>
}

export default async function EditarResidentePage({ params }: EditarResidentePageProps) {
  const { id } = await params
  
  const [residente, residencias] = await Promise.all([
    getResidente(id),
    getResidenciasConHabitaciones()
  ])

  if (!residente) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title={`Editar Residente: ${residente.user.nombre}`}
        description="Modifica la información del residente o reasigna su habitación."
      />

      <ResidenteForm 
        residencias={residencias} 
        initialData={residente} 
      />
    </div>
  )
}
