import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Building2 } from 'lucide-react'
import { ResidenciaCard } from '@/components/admin/ResidenciaCard'
import { AddResidenciaButton } from '@/components/admin/AddResidenciaButton'

import { GeneralPagination } from '@/components/shared/GeneralPagination'

export default async function ResidenciasPage({ searchParams }: { 
    searchParams: Promise<{ page?: string, limit?: string }> 
}) {
    const session = await auth()
    const { residenciaId, rol } = session!.user
    const isGlobalAdmin = rol === 'ADMIN' && !residenciaId
    const params = await searchParams
    const page = parseInt(params.page || '1')
    const limit = parseInt(params.limit || '10')

    const whereClause = isGlobalAdmin ? {} : { id: residenciaId || -1 }

    const [residencias, totalResidencias] = await Promise.all([
        prisma.residencia.findMany({
            where: whereClause,
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
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.residencia.count({ where: whereClause })
    ])

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <PageHeader
                    title="Residencias"
                    description={isGlobalAdmin ? "Gestiona todas las residencias del sistema." : "Información de tu residencia."}
                />
                {isGlobalAdmin && <AddResidenciaButton />}
            </div>

            {totalResidencias === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <EmptyState
                        icon={<Building2 size={48} />}
                        title="No hay residencias registradas"
                        description="Cuando agregues residencias, aparecerán aquí."
                    />
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {residencias.map((res: any) => (
                            <ResidenciaCard key={res.id} res={res} />
                        ))}
                    </div>
                    <GeneralPagination totalItems={totalResidencias} currentPage={page} itemsPerPage={limit} label="Residencias" />
                </>
            )}
        </div>
    )
}
