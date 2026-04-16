import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { UtensilsCrossed, Calendar, CheckCircle, Plus } from 'lucide-react'
import Link from 'next/link'

const TIPO_LABEL: Record<string, string> = {
    DESAYUNO: 'Desayuno', ALMUERZO: 'Almuerzo', CENA: 'Cena',
}
const TIPO_COLOR: Record<string, string> = {
    DESAYUNO: 'bg-orange-50 text-orange-700 border-orange-100',
    ALMUERZO: 'bg-blue-50 text-blue-700 border-blue-100',
    CENA: 'bg-purple-50 text-purple-700 border-purple-100',
}

export default async function ComidaPage() {
    const session = await auth()
    const { rol, permisos } = session!.user
    const canManage = rol === 'ADMIN' || rol === 'COCINERO' || permisos?.includes('COMIDAS_POST')

    // Si es residente, filtrar por su residencia
    let residenciaId: number | null = null
    let residenteId: number | null = null
    
    if (rol === 'RESIDENTE') {
        const profile = await prisma.residente.findFirst({
            where: { user: { email: session!.user.email as string } },
            select: { id: true, habitacion: { select: { residenciaId: true } } }
        })
        residenciaId = profile?.habitacion?.residenciaId ?? null
        residenteId = profile?.id ?? null
    }

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const menus = await prisma.menu.findMany({
        where: {
            activo: true,
            fecha: { gte: hoy },
            ...(residenciaId ? { residencias: { some: { residenciaId } } } : {})
        },
        include: {
            asistencias: true,
            _count: { select: { asistencias: { where: { asiste: true } } } },
            residencias: { include: { residencia: true } }
        },
        orderBy: [{ fecha: 'asc' }, { tipo: 'asc' }]
    })

    return (
        <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <PageHeader
                    title="Alimentación y Nutrición"
                    description={residenciaId ? " Consulta los menús de tu residencia y confirma tu asistencia." : "Planifica y gestiona los menús de las residencias."}
                />
                {canManage && (
                    <Link
                        href="/modules/comida/nuevo"
                        className="flex items-center gap-2 bg-[#1D9E75] text-white px-6 py-3 rounded-2xl font-black hover:bg-[#085041] transition-all shadow-xl shadow-[#1D9E75]/20"
                    >
                        <Plus size={18} />
                        Nuevo Menú
                    </Link>
                )}
            </div>

            {menus.length === 0 ? (
                <EmptyState
                    icon={<UtensilsCrossed size={64} />}
                    title="No hay menús programados"
                    description="Pronto verás aquí la programación de comidas de la semana."
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {menus.map((menu: any) => {
                        const miAsistencia = menu.asistencias.find((a: any) => a.residenteId === residenteId)
                        const asiste = miAsistencia?.asiste
                        
                        return (
                            <div key={menu.id} className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden flex flex-col group hover:shadow-2xl hover:-translate-y-1 transition-all">
                                <div className="p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${TIPO_COLOR[menu.tipo]}`}>
                                            {TIPO_LABEL[menu.tipo]}
                                        </span>
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <Calendar size={14} />
                                            <span className="text-[10px] font-bold uppercase tracking-tighter">
                                                {new Date(menu.fecha).toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-black text-[#072E1F] leading-tight mb-2 group-hover:text-[#1D9E75] transition-colors">{menu.nombre}</h3>
                                    <p className="text-sm text-gray-500 line-clamp-2">{menu.descripcion || 'Sin descripción detallada.'}</p>
                                    
                                    {canManage && (
                                        <div className="mt-6 flex items-center gap-4 py-4 border-t border-gray-50">
                                            <div className="flex -space-x-2">
                                                {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-4 border-white bg-gray-100 flex items-center justify-center text-[8px] font-bold">+</div>)}
                                            </div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                {menu._count.asistencias} Asistencias Confirmadas
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {!canManage && (
                                    <div className="mt-auto p-4 bg-gray-50/50 border-t border-gray-50 flex items-center gap-3">
                                        <button className={`flex-1 py-3.5 rounded-2xl font-black text-xs transition-all shadow-sm ${
                                            asiste === true ? 'bg-green-500 text-white shadow-green-200' : 'bg-white border border-gray-100 text-[#1D9E75] hover:bg-green-50'
                                        }`}>
                                            {asiste === true ? 'CONFIRMADO' : 'CONFIRMAR ASISTENCIA'}
                                        </button>
                                        <button className={`w-14 h-12 flex items-center justify-center rounded-2xl font-black transition-all ${
                                            asiste === false ? 'bg-red-500 text-white' : 'bg-white border border-gray-100 text-red-500 hover:bg-red-50'
                                        }`}>
                                            {asiste === false ? '✓' : '✗'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
