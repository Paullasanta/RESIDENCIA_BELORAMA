import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Building2, Users, Home } from 'lucide-react'

export default async function ResidenciasPage() {
    const residencias = await prisma.residencia.findMany({
        include: {
            _count: {
                select: { users: true, habitaciones: true },
            },
            habitaciones: {
                select: { disponible: true },
            },
        },
        orderBy: { createdAt: 'desc' },
    })

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <PageHeader
                title="Residencias"
                description="Gestiona todas las residencias del sistema."
            />

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
                    {residencias.map((res) => {
                        const disponibles = res.habitaciones.filter(h => h.disponible).length
                        const ocupadas = res.habitaciones.length - disponibles
                        const ocupPct = res.habitaciones.length > 0
                            ? Math.round((ocupadas / res.habitaciones.length) * 100)
                            : 0

                        return (
                            <div key={res.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                                {/* Header */}
                                <div className="p-6 border-b border-gray-50">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold text-[#072E1F]">{res.nombre}</h3>
                                            <p className="text-sm text-gray-500 mt-1">{res.direccion}</p>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${res.activa ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {res.activa ? 'Activa' : 'Inactiva'}
                                        </span>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="p-6 space-y-4">
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Users size={16} className="text-[#1D9E75]" />
                                            <span><strong className="text-gray-900">{res._count.users}</strong> usuarios</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Home size={16} className="text-[#EF9F27]" />
                                            <span><strong className="text-gray-900">{res._count.habitaciones}</strong> habitaciones</span>
                                        </div>
                                    </div>

                                    {/* Ocupación Bar */}
                                    <div>
                                        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                                            <span>Ocupación</span>
                                            <span>{ocupPct}%</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#1D9E75] rounded-full transition-all"
                                                style={{ width: `${ocupPct}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-xs mt-1.5 text-gray-400">
                                            <span>{disponibles} disponibles</span>
                                            <span>{ocupadas} ocupadas</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                                    <p className="text-xs text-gray-400">Capacidad máx: {res.capacidad} personas</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
