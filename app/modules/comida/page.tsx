import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { UtensilsCrossed, Calendar, Plus, Clock, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { AsistenciaButtons } from '@/components/comida/AsistenciaButtons'

const TIPO_LABEL: Record<string, string> = {
    DESAYUNO: 'Desayuno', ALMUERZO: 'Almuerzo', CENA: 'Cena',
}

const TIPO_COLOR_BAR: Record<string, string> = {
    DESAYUNO: 'bg-orange-500',
    ALMUERZO: 'bg-blue-500',
    CENA: 'bg-indigo-500',
}

export default async function ComidaPage() {
    const session = await auth()
    if (!session) return null

    const { rol, permisos, residenciaId: sessionResId } = session.user
    const isAnyAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(rol)
    const canManage = isAnyAdmin || rol === 'COCINERO' || permisos?.includes('COMIDAS_POST')
    const isGlobalAdmin = isAnyAdmin && !sessionResId

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

    const hoy = new Date()
    const inicioDia = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()))

    const menus = await prisma.menu.findMany({
        where: {
            activo: true,
            fecha: { gte: inicioDia },
            ...(isGlobalAdmin ? {} : { residencias: { some: { residenciaId: residenciaId || -1 } } })
        },
        include: {
            asistencias: true,
            residencias: { include: { residencia: true } }
        },
        orderBy: [{ fecha: 'asc' }, { tipo: 'asc' }]
    })

    // Datos maestros para el conteo global por residencia (filtrado si no es global admin)
    const residentesActivos = await prisma.residente.findMany({
        where: { 
            activo: true,
            ...(isGlobalAdmin ? {} : { user: { residenciaId: residenciaId || -1 } })
        },
        select: { 
            id: true, 
            alergias: true,
            restriccionesAlimentarias: true,
            habitacion: { select: { residenciaId: true } },
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
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-6">
                <div>
                    <h1 className="text-3xl font-black text-[#072E1F] tracking-tight">Cartilla de Alimentación</h1>
                    <p className="text-sm text-gray-400 font-medium mt-1">Suministro diario proyectado basado en residentes activos.</p>
                </div>
                {canManage && (
                    <Link
                        href="/modules/comida/nuevo"
                        className="bg-[#072E1F] text-white px-5 py-3 rounded-xl font-bold text-xs hover:bg-black transition-all flex items-center gap-2"
                    >
                        <Plus size={14} />
                        PROGRAMAR MENÚ
                    </Link>
                )}
            </div>

            {/* Alertas Nutricionales para Cocina */}
            {canManage && alertasNutricionales.length > 0 && (
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
                    title="No hay programación"
                    description="Vuelve más tarde para consultar la cartilla nutricional."
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {dailyPlans.map((plan: any) => {
                        const isLocked = plan.fechaLimite ? hoy > new Date(plan.fechaLimite) : false;
                        const dateObj = new Date(plan.fecha);
                        
                        return (
                            <div key={plan.fecha.toString()} className="bg-white border border-gray-200 rounded-[1.5rem] shadow-sm flex flex-col overflow-hidden hover:border-gray-400 transition-all duration-300">
                                {/* Header Minimalista */}
                                <div className="p-6 pb-4 border-b border-gray-100 bg-gray-50/20">
                                    <div className="flex items-baseline justify-between mb-1">
                                        <h3 className="text-xl font-black text-[#072E1F] uppercase tracking-tighter">
                                            {dateObj.toLocaleDateString('es-MX', { weekday: 'long', timeZone: 'UTC' })}
                                        </h3>
                                        <span className="text-sm font-black text-gray-300">
                                            {dateObj.getUTCDate()}
                                        </span>
                                    </div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">
                                        {dateObj.toLocaleDateString('es-MX', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                                    </p>
                                    
                                    {plan.fechaLimite && (
                                        <div className={`mt-4 flex items-center gap-2 text-[9px] font-bold ${isLocked ? 'text-red-400' : 'text-gray-400'}`}>
                                            <Clock size={12} />
                                            LIM: {new Date(plan.fechaLimite).toLocaleDateString('es-MX', { day:'2-digit', month: 'short' })} {new Date(plan.fechaLimite).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    )}
                                </div>

                                {/* Cuerpo de Cartilla */}
                                <div className="p-0 flex-1 divide-y divide-gray-50">
                                    {['DESAYUNO', 'ALMUERZO', 'CENA'].map(tipo => {
                                        const menu = plan.menus.find((m: any) => m.tipo === tipo);

                                        if (!menu) {
                                            return (
                                                <div key={tipo} className="p-5 flex items-center justify-between opacity-20 grayscale">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-1 h-6 rounded-full ${TIPO_COLOR_BAR[tipo]}`} />
                                                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{TIPO_LABEL[tipo]}</span>
                                                    </div>
                                                    <span className="text-[10px] font-bold italic text-gray-400">---</span>
                                                </div>
                                            )
                                        }

                                        const miAsistencia = menu.asistencias.find((a: any) => a.residenteId === residenteId);
                                        const asiste = miAsistencia ? miAsistencia.asiste : true;

                                        return (
                                            <div key={menu.id} className="p-5 flex flex-col gap-3 group relative hover:bg-gray-50/50 transition-colors">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex items-start gap-3 min-w-0">
                                                        <div className={`w-1 h-8 rounded-full shrink-0 ${TIPO_COLOR_BAR[tipo]}`} />
                                                        <div className="min-w-0">
                                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{TIPO_LABEL[tipo]}</p>
                                                            <h4 className="font-black text-[#072E1F] text-xs leading-tight line-clamp-2">{menu.nombre}</h4>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* El Contador Numérico para Admin */}
                                                    {canManage ? (
                                                        <div className="bg-[#072E1F] text-white px-3 py-2 rounded-lg font-black text-lg min-w-[50px] text-center shadow-lg shadow-[#072E1F]/20 flex flex-col items-center">
                                                            <span>{menu.totalConfirmados}</span>
                                                            <span className="text-[7px] text-white/50 uppercase tracking-tighter mt-0.5">Raciones</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-center">
                                                            {/* Placeholder or subtle check for resident? */}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Controles Minimalistas para Residente */}
                                                {!canManage && residenteId && (
                                                    <AsistenciaButtons 
                                                        residenteId={residenteId} 
                                                        menuId={menu.id} 
                                                        asiste={asiste} 
                                                        isLocked={isLocked}
                                                        variant="cartilla"
                                                    />
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
