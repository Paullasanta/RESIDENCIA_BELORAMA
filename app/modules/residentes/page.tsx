import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { UserPlus } from 'lucide-react'
import Link from 'next/link'
import { ResidentesTable } from '@/components/admin/ResidentesTable'
import { GeneralPagination } from '@/components/shared/GeneralPagination'
import { ResidenciasExplorer } from '@/components/admin/ResidenciasExplorer'

export default async function ResidentesPage({ searchParams }: { searchParams: Promise<{ status?: string, page?: string, limit?: string }> }) {
    const session = await auth()
    const { residenciaId, rol } = session!.user
    const { status, page: pageParam, limit: limitParam } = await searchParams
    const page = parseInt(pageParam || '1')
    const limit = parseInt(limitParam || '10')
    const showInactive = status === 'inactive'

    // Aislamiento: Si no es Admin Global (sin sede), filtrar por su residenciaId
    const whereClause = {
        activo: !showInactive,
        ...((['ADMIN', 'SUPER_ADMIN'].includes(rol) && !residenciaId) ? {} : {
            user: { residenciaId: residenciaId || -1 }
        })
    }

    const totalItems = await prisma.residente.count({ where: whereClause })
    
    // Traer residencias para el explorador
    const residencias = await prisma.residencia.findMany({
        where: (['ADMIN', 'SUPER_ADMIN'].includes(rol) && !residenciaId) ? {} : { id: residenciaId || -1 },
        include: {
            habitaciones: {
                include: { 
                    residentes: { where: { activo: true }, include: { user: true } },
                    reservas: { where: { estado: 'PENDIENTE' } }
                }
            }
        },
        orderBy: { nombre: 'asc' }
    })

    const residentes = await prisma.residente.findMany({
        where: whereClause,
        include: {
            user: {
                include: { residencia: true }
            },
            habitacion: {
                include: { residencia: true },
            },
            pagos: {
                orderBy: { fechaVencimiento: 'desc' },
                take: 20,
            },
        },
        orderBy: { fechaIngreso: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
    })

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <PageHeader
                    title="Módulo de Residentes"
                    description="Administración de perfiles, accesos y gestión integral de habitaciones."
                />
                <div className="flex items-center gap-3">
                    <Link
                        href="/modules/residentes/nuevo"
                        className="flex items-center justify-center gap-2 bg-[#1D9E75] hover:bg-[#167e5d] text-white px-6 py-3 rounded-[1.25rem] font-bold transition-all shadow-xl shadow-[#1D9E75]/20 text-sm whitespace-nowrap"
                    >
                        <UserPlus size={18} />
                        Nuevo Residente
                    </Link>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center gap-4 border-b border-gray-100 pb-1">
                    <Link 
                        href="/modules/residentes" 
                        className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all border-b-2 ${!showInactive ? 'border-[#1D9E75] text-[#1D9E75]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        Activos
                    </Link>
                    <Link 
                        href="/modules/residentes?status=inactive" 
                        className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all border-b-2 ${showInactive ? 'border-[#1D9E75] text-[#1D9E75]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        Inactivos
                    </Link>
                </div>

                <ResidentesTable residentes={residentes} isInactiveView={showInactive} />

                <GeneralPagination 
                    totalItems={totalItems} 
                    currentPage={page} 
                    itemsPerPage={limit} 
                    label="Residentes" 
                />
            </div>
        </div>
    )
}
