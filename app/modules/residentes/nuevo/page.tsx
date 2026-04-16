import { getResidenciasConHabitaciones } from '@/app/actions/residentes'
import { PageHeader } from '@/components/shared/PageHeader'
import { ResidenteForm } from '@/components/forms/ResidenteForm'

export default async function NuevoResidentePage() {
  const residencias = await getResidenciasConHabitaciones()

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Añadir Nuevo Residente"
        description="Completa la información para dar de alta un acceso y perfil de residente."
      />

      <ResidenteForm residencias={residencias} />
    </div>
  )
}
