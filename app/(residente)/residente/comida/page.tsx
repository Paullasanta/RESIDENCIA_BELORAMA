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

const TIPO_EMOJI: Record<string, string> = {
    DESAYUNO: '🌅',
    ALMUERZO: '☀️',
    CENA: '🌙',
}

const TIPO_COLOR: Record<string, string> = {
    DESAYUNO: 'from-orange-50 to-amber-50 border-orange-100',
    ALMUERZO: 'from-blue-50 to-sky-50 border-blue-100',
    CENA: 'from-purple-50 to-violet-50 border-purple-100',
}

const TIPO_BADGE: Record<string, string> = {
    DESAYUNO: 'bg-orange-100 text-orange-700',
    ALMUERZO: 'bg-blue-100 text-blue-700',
    CENA: 'bg-purple-100 text-purple-700',
}

export default async function ComidaResidentePage() {
    const session = await auth()

    const residente = await prisma.residente.findFirst({
        where: { user: { email: session!.user.email } },
        include: { habitacion: { include: { residencia: true } } },
    })

    const residenciaId = residente?.habitacion?.residenciaId

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const mañana = new Date(hoy)
    mañana.setDate(mañana.getDate() + 1)

    const menusSemana = residenciaId
        ? await prisma.menu.findMany({
            where: {
                activo: true,
                fecha: { gte: hoy, lt: new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000) },
                residencias: { some: { residenciaId } },
            },
            include: {
                asistencias: {
                    where: residente ? { residenteId: residente.id } : undefined,
                },
            },
            orderBy: [{ fecha: 'asc' }, { tipo: 'asc' }],
        })
        : []

    const menusHoy = menusSemana.filter(m => {
        const f = new Date(m.fecha); f.setHours(0,0,0,0)
        return f.getTime() === hoy.getTime()
    })

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <PageHeader
                title="Comida del Día"
                description={`Menú de hoy — ${hoy.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}`}
            />

            {!residenciaId ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <EmptyState
                        icon={<UtensilsCrossed size={48} />}
                        title="Sin residencia asignada"
                        description="Necesitas estar asignado a una residencia para ver el menú."
                    />
                </div>
            ) : menusHoy.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <EmptyState
                        icon={<UtensilsCrossed size={48} />}
                        title="El menú de hoy aún no está publicado"
                        description="El cocinero publicará el menú del día más tarde."
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {menusHoy.map(menu => {
                        const asistiré = menu.asistencias[0]?.asiste !== false && menu.asistencias.length > 0
                        return (
                            <div key={menu.id} className={`bg-gradient-to-br ${TIPO_COLOR[menu.tipo]} border rounded-2xl p-6`}>
                                <div className="flex items-center justify-between mb-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${TIPO_BADGE[menu.tipo]}`}>
                                        {TIPO_EMOJI[menu.tipo]} {TIPO_LABEL[menu.tipo]}
                                    </span>
                                    {menu.asistencias.length > 0 ? (
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${asistiré ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {asistiré ? '✓ Asistiré' : '✗ No asistiré'}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-400">Sin confirmar</span>
                                    )}
                                </div>
                                <h3 className="text-xl font-extrabold text-gray-900 leading-tight">{menu.nombre}</h3>
                                {menu.descripcion && <p className="text-sm text-gray-600 mt-2">{menu.descripcion}</p>}
                                <p className="text-xs text-gray-400 mt-4">
                                    {new Date(menu.fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} hrs
                                </p>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
