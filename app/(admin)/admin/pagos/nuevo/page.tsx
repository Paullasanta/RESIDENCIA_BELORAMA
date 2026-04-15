import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { PagoForm } from '@/components/forms/PagoForm'

export default async function NuevoPagoPage() {
    const residentes = await prisma.residente.findMany({
        where: { activo: true },
        include: { 
            user: true,
            habitacion: { include: { residencia: true } }
        },
        orderBy: { user: { nombre: 'asc' } }
    })

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
                title="Registrar Cobro"
                description="Crea un nuevo registro de pago o plan de cuotas para un residente."
            />

            <PagoForm residentes={residentes} />
        </div>
    )
}
