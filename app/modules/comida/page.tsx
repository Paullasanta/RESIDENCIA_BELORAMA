import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EmptyState } from '@/components/shared/EmptyState'
import { UtensilsCrossed, Plus } from 'lucide-react'
import Link from 'next/link'
import { DailyPlanCard } from '@/components/comida/DailyPlanCard'
import { AutoRefresh } from '@/components/shared/AutoRefresh'
import { getLimaNow } from '@/lib/utils'

const TIPO_LABEL: Record<string, string> = {
    DESAYUNO: 'Desayuno', ALMUERZO: 'Almuerzo', CENA: 'Cena',
}

const TIPO_COLOR_BAR: Record<string, string> = {
    DESAYUNO: 'bg-orange-500',
    ALMUERZO: 'bg-blue-500',
    CENA: 'bg-indigo-500',
}

export default async function ComidaPage({ 
    searchParams 
}: { 
    searchParams: Promise<{ view?: string }> 
}) {
    const view = (await searchParams).view || 'actuales'
    const session = await auth()
    if (!session) return null

    const { rol, permisos, residenciaId: sessionResId } = session.user
    const isAnyAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(rol)
    const canManage = isAnyAdmin || rol === 'COCINERO' || permisos?.includes('COMIDAS_POST')
    const isGlobalAdmin = (isAnyAdmin || rol === 'COCINERO') && !sessionResId

    let residenciaId: number | null = sessionResId || null
    let residenteId: number | null = null
    
    if (rol === 'RESIDENTE') {
        const profile = await prisma.residente.findFirst({
            where: { user: { email: session.user.email as string } },
            select: { id: true, habitacion: { select: { residenciaId: true } } }
        })
        residenciaId = profile?.habitacion?.residenciaId ?? sessionResId ?? null
        residenteId = profile?.id ?? null
    }

    const now = getLimaNow()
    // Los menús de días anteriores a hoy pasan a la pestaña de "Pasadas"
    // Usamos Date.UTC con los componentes locales (ya ajustados a Lima) para coincidir con la DB
    const todayStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))

    const menus = await prisma.menu.findMany({
        where: {
            activo: true,
            fecha: view === 'actuales' ? { gte: todayStart } : { lt: todayStart },
            ...(isGlobalAdmin ? {} : { residencias: { some: { residenciaId: residenciaId || -1 } } })
        },
        include: {
            asistencias: true,
            residencias: { include: { residencia: true } }
        },
        orderBy: view === 'actuales' ? [{ fecha: 'asc' }, { tipo: 'asc' }] : [{ fecha: 'desc' }, { tipo: 'desc' }]
    })

    const residentesActivos = await prisma.residente.findMany({
        where: { 
            activo: true,
            ...(isGlobalAdmin ? {} : { user: { residenciaId: residenciaId || -1 } })
        },
        select: { 
            id: true, 
            alergias: true,
            restriccionesAlimentarias: true,
            habitacion: { 
                select: { 
                    residenciaId: true,
                    residencia: { select: { nombre: true } }
                } 
            },
            user: { select: { nombre: true } }
        }
    })
    
    const countByResidencia: Record<number, number> = {}
    const alertasNutricionales: { nombre: string, alerta: string }[] = []

    residentesActivos.forEach(r => {
        const rId = r.habitacion?.residenciaId
        if (rId) countByResidencia[rId] = (countByResidencia[rId] || 0) + 1
        
        if (r.alergias || r.restriccionesAlimentarias) {
            alertasNutricionales.push({
                nombre: r.user.nombre,
                alerta: [r.alergias, r.restriccionesAlimentarias].filter(Boolean).join(' / ')
            })
        }
    })

    const menusCalculados = menus.map(menu => {
        const tPosibles = menu.residencias.reduce((sum, r) => sum + (countByResidencia[r.residenciaId] || 0), 0)
        const cancelados = menu.asistencias.filter(a => a.asiste === false).length
        const totalConfirmados = Math.max(0, tPosibles - cancelados)
        return { ...menu, totalConfirmados }
    })

    const groupedMenus = menusCalculados.reduce((acc: any, menu: any) => {
        const dateStr = new Date(menu.fecha).toISOString().split('T')[0];
        if (!acc[dateStr]) {
            acc[dateStr] = {
                fecha: menu.fecha,
                fechaLimite: menu.fechaLimite,
                menus: []
            };
        }
        acc[dateStr].menus.push(menu);
        return acc;
    }, {});
    
    const dailyPlans = Object.values(groupedMenus);

    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-20">
            <AutoRefresh interval={60000} />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-6">
                <div>
                    <h1 className="text-3xl font-black text-[#072E1F] tracking-tight">Cartilla de Alimentación</h1>
                    <p className="text-sm text-gray-400 font-medium mt-1">Suministro diario proyectado basado en residentes activos.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-gray-100 p-1 rounded-xl flex items-center shrink-0">
                        <Link 
                            href="?view=actuales"
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'actuales' ? 'bg-[#072E1F] text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Actuales
                        </Link>
                        <Link 
                            href="?view=pasadas"
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'pasadas' ? 'bg-[#072E1F] text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Pasadas
                        </Link>
                    </div>
                    {canManage && (
                        <Link
                            href="/modules/comida/nuevo"
                            className="bg-[#1D9E75] text-white px-5 py-3 rounded-xl font-bold text-xs hover:bg-[#158060] transition-all flex items-center gap-2 shadow-lg shadow-[#1D9E75]/20"
                        >
                            <Plus size={14} />
                            PROGRAMAR
                        </Link>
                    )}
                </div>
            </div>

            {view === 'actuales' && canManage && alertasNutricionales.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex flex-col md:flex-row gap-6 items-start animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="bg-amber-500 text-white p-3 rounded-2xl shadow-lg shadow-amber-500/20">
                        <UtensilsCrossed size={24} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-amber-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                            Alertas de Nutrición y Alergias
                            <span className="bg-amber-200 text-amber-800 text-[10px] px-2 py-0.5 rounded-full">{alertasNutricionales.length}</span>
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {alertasNutricionales.map((alerta, idx) => (
                                <div key={idx} className="bg-white/60 border border-amber-200 px-3 py-1.5 rounded-xl flex flex-col">
                                    <span className="text-[10px] font-black text-amber-900">{alerta.nombre}</span>
                                    <span className="text-[9px] font-bold text-amber-600 uppercase tracking-tighter">{alerta.alerta}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {dailyPlans.length === 0 ? (
                <EmptyState
                    icon={<UtensilsCrossed size={64} className="opacity-5" />}
                    title={view === 'actuales' ? "No hay programación" : "Sin historial"}
                    description={view === 'actuales' ? "Vuelve más tarde para consultar la cartilla nutricional." : "No se encontraron menús archivados."}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {dailyPlans.map((plan: any) => (
                        <DailyPlanCard 
                            key={plan.fecha.toString()}
                            plan={plan}
                            canManage={canManage}
                            residentesActivos={residentesActivos}
                            residenteId={residenteId}
                            hoy={now}
                            tipoLabel={TIPO_LABEL}
                            tipoColorBar={TIPO_COLOR_BAR}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
