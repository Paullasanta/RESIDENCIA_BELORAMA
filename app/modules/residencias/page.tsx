import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Building2 } from 'lucide-react'
import { ResidenciaCard } from '@/components/admin/ResidenciaCard'
import { AddResidenciaButton } from '@/components/admin/AddResidenciaButton'

export default async function ResidenciasPage() {
    const residencias = await prisma.residencia.findMany({
        select: {
            id: true,
            nombre: true,
            direccion: true,
            activa: true,
            capacidad: true,
            createdAt: true,
            _count: {
                select: { users: true, habitaciones: true, lavadoras: true },
            },
            habitaciones: {
                select: { estado: true },
            },
        },
        orderBy: { createdAt: 'desc' },
    })

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <PageHeader
                    title="Residencias"
                    description="Gestiona todas las residencias del sistema."
                />
                <AddResidenciaButton />
            </div>

            {residencias.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <EmptyState
                        icon={<Building2 size={48} />}
                        title="No hay residencias registradas"
                        description="Cuando agregues residencias, aparecerán aquí."
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {residencias.map((res: any) => (
                        <ResidenciaCard key={res.id} res={res} />
                    ))}
                </div>
            )}
        </div>
    )
}
