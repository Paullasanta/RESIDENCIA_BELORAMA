import { auth } from '@/lib/auth'
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

const TIPO_EMOJI: Record<string, string> = {
    DESAYUNO: '🌅',
    ALMUERZO: '☀️',
    CENA: '🌙',
}

export default async function ComidaCocineroPage() {
    const session = await auth()

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const mañana = new Date(hoy)
    mañana.setDate(mañana.getDate() + 1)

    const menusHoy = await prisma.menu.findMany({
        where: {
            fecha: { gte: hoy, lt: mañana },
        },
        include: {
            _count: { select: { asistencias: true } },
            residencias: { include: { residencia: true } },
        },
        orderBy: { tipo: 'asc' },
    })

    const menusRecientes = await prisma.menu.findMany({
        where: {
            fecha: { lt: hoy },
        },
        include: {
            _count: { select: { asistencias: true } },
        },
        orderBy: { fecha: 'desc' },
        take: 10,
    })

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <PageHeader
                title="Publicar Comidas"
                description={`Hoy: ${hoy.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}`}
            />

            {/* Menús de hoy */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-[#085041]">Menú de Hoy</h2>
                </div>

                {menusHoy.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-dashed border-gray-200 p-10">
                        <EmptyState
                            icon={<UtensilsCrossed size={48} />}
                            title="Aún no has publicado el menú de hoy"
                            description="Cuando publiques el menú, los residentes podrán verlo y confirmar asistencia."
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {menusHoy.map(menu => (
                            <div key={menu.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className={`h-2 ${menu.tipo === 'DESAYUNO' ? 'bg-orange-400' : menu.tipo === 'ALMUERZO' ? 'bg-blue-400' : 'bg-purple-500'}`} />
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${TIPO_COLOR[menu.tipo]}`}>
                                            {TIPO_EMOJI[menu.tipo]} {TIPO_LABEL[menu.tipo]}
                                        </span>
                                        <span className="text-xs text-gray-400">{menu._count.asistencias} confirman</span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-lg">{menu.nombre}</h3>
                                    {menu.descripcion && <p className="text-sm text-gray-500 mt-1">{menu.descripcion}</p>}
                                    {menu.residencias.length > 0 && (
                                        <p className="text-xs text-gray-400 mt-3">{menu.residencias.map(r => r.residencia.nombre).join(', ')}</p>
                                    )}
                                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${menu.activo ? 'bg-green-400' : 'bg-gray-300'}`} />
                                        <span className="text-xs text-gray-500">{menu.activo ? 'Publicado' : 'Inactivo'}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Historial reciente */}
            {menusRecientes.length > 0 && (
                <div>
                    <h2 className="text-lg font-bold text-[#085041] mb-4">Historial de Menús</h2>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/80">
                                    <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Nombre</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Tipo</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Fecha</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Asistencias</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {menusRecientes.map(menu => (
                                    <tr key={menu.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">{menu.nombre}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${TIPO_COLOR[menu.tipo]}`}>
                                                {TIPO_EMOJI[menu.tipo]} {TIPO_LABEL[menu.tipo]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-xs">
                                            {new Date(menu.fecha).toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short' })}
                                        </td>
                                        <td className="px-6 py-4 text-gray-700 font-medium">{menu._count.asistencias}</td>
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
