import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { UtensilsCrossed } from 'lucide-react'

const TIPO_LABEL: Record<string, string> = {
    DESAYUNO: 'Desayuno',
    ALMUERZO: 'Almuerzo',
    CENA: 'Cena',
}

const TIPO_COLOR: Record<string, string> = {
    DESAYUNO: 'bg-orange-100 text-orange-700',
    ALMUERZO: 'bg-blue-100 text-blue-700',
    CENA: 'bg-purple-100 text-purple-700',
}

export default async function ComidaPage() {
    const menus = await prisma.menu.findMany({
        include: {
            _count: { select: { asistencias: true } },
            residencias: { include: { residencia: true } },
        },
        orderBy: { fecha: 'desc' },
        take: 30,
    })

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const menusHoy = menus.filter(m => {
        const fecha = new Date(m.fecha)
        fecha.setHours(0, 0, 0, 0)
        return fecha.getTime() === hoy.getTime()
    })

    const menusPasados = menus.filter(m => {
        const fecha = new Date(m.fecha)
        fecha.setHours(0, 0, 0, 0)
        return fecha.getTime() !== hoy.getTime()
    })

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <PageHeader
                title="Gestión de Comidas"
                description="Menús publicados y asistencias del comedor."
            />

            {/* Menús de hoy */}
            <div>
                <h2 className="text-lg font-bold text-[#072E1F] mb-4">Menús de Hoy</h2>
                {menusHoy.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <EmptyState
                            icon={<UtensilsCrossed size={40} />}
                            title="Sin menús publicados para hoy"
                            description="El cocinero aún no ha publicado el menú del día."
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {menusHoy.map(menu => (
                            <div key={menu.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${TIPO_COLOR[menu.tipo]}`}>
                                        {TIPO_LABEL[menu.tipo]}
                                    </span>
                                    <span className="text-xs text-gray-400">{menu._count.asistencias} asistencias</span>
                                </div>
                                <h3 className="font-bold text-gray-900">{menu.nombre}</h3>
                                {menu.descripcion && <p className="text-sm text-gray-500 mt-1">{menu.descripcion}</p>}
                                {menu.residencias.length > 0 && (
                                    <p className="text-xs text-gray-400 mt-3">{menu.residencias.map(r => r.residencia.nombre).join(', ')}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Historial */}
            {menusPasados.length > 0 && (
                <div>
                    <h2 className="text-lg font-bold text-[#072E1F] mb-4">Historial Reciente</h2>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/80">
                                    <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Menú</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Tipo</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Fecha</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Asistencias</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {menusPasados.map(menu => (
                                    <tr key={menu.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">{menu.nombre}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${TIPO_COLOR[menu.tipo]}`}>
                                                {TIPO_LABEL[menu.tipo]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-xs">
                                            {new Date(menu.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">{menu._count.asistencias}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${menu.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {menu.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
