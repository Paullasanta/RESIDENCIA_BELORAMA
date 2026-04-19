import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { UtensilsCrossed, Calendar, Plus, Clock } from 'lucide-react'
import Link from 'next/link'
import { AsistenciaButtons } from '@/components/comida/AsistenciaButtons'

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
    // Convert current local date to UTC midnight (aligns with DB saves from input type=date)
    const inicioDia = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()))

    const menus = await prisma.menu.findMany({
        where: {
            activo: true,
            fecha: { gte: inicioDia },
            ...(residenciaId ? { residencias: { some: { residenciaId } } } : {})
        },
        include: {
            asistencias: true,
            residencias: { include: { residencia: true } }
        },
        orderBy: [{ fecha: 'asc' }, { tipo: 'asc' }]
    })

    // Calcular cupos totales implícitos (opt-out)
    const residentesActivos = await prisma.residente.findMany({
        where: { activo: true },
        select: { id: true, habitacion: { select: { residenciaId: true } } }
    })
    
    const countByResidencia: Record<number, number> = {}
    residentesActivos.forEach(r => {
        const rId = r.habitacion?.residenciaId
        if (rId) countByResidencia[rId] = (countByResidencia[rId] || 0) + 1
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
        <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <PageHeader
                    title="Alimentación y Nutrición"
                    description={residenciaId ? " Consulta tus menús. Recuerda que tu asistencia está confirmada por defecto a menos que marques lo contrario." : "Planifica y gestiona los menús de las residencias."}
                />
                {canManage && (
                    <div className="flex items-center gap-3">
                        <Link
                            href="/modules/comida/nuevo"
                            className="flex items-center gap-2 bg-[#1D9E75] text-white px-6 py-3 rounded-[1.25rem] font-black hover:bg-[#167e5d] transition-all shadow-xl shadow-[#1D9E75]/20"
                        >
                            <Plus size={18} />
                            Programar Día
                        </Link>
                    </div>
                )}
            </div>

            {/* Admin Stats / Weekly Summary */}
            {canManage && menusCalculados.length > 0 && (
                <div className="bg-[#072E1F] rounded-[2.5rem] p-8 text-white shadow-2xl shadow-[#072E1F]/20 flex flex-col md:flex-row items-center gap-8 border border-white/5 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="w-16 h-16 bg-[#1D9E75] rounded-2xl flex items-center justify-center shadow-lg">
                        <UtensilsCrossed size={32} />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h3 className="text-xl font-black">Planificación Semanal</h3>
                        <p className="text-sm text-white/60 font-medium">Resumen de raciones efectivas esperadas (Cupos totales - Cancelados).</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full md:w-auto">
                        {['DESAYUNO', 'ALMUERZO', 'CENA'].map(tipo => {
                            const count = menusCalculados
                                .filter(m => m.tipo === tipo)
                                .reduce((s, m) => s + m.totalConfirmados, 0)
                            return (
                                <div key={tipo} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col items-center min-w-[100px]">
                                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">{tipo}</span>
                                    <span className="text-2xl font-black">{count}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {dailyPlans.length === 0 ? (
                <EmptyState
                    icon={<UtensilsCrossed size={64} />}
                    title="No hay menús programados"
                    description="Pronto verás aquí la programación de comidas por defecto."
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {dailyPlans.map((plan: any) => {
                        const isLocked = plan.fechaLimite ? hoy > new Date(plan.fechaLimite) : false;
                        
                        return (
                            <div key={plan.fecha.toString()} className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-100/50 border border-gray-100 overflow-hidden flex flex-col group hover:shadow-2xl transition-all duration-300">
                                {/* Header del Día */}
                                <div className="p-7 pb-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50 group-hover:bg-[#1D9E75]/5 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col items-center justify-center text-[#1D9E75]">
                                            <span className="text-[9px] font-black uppercase tracking-widest leading-none">{new Date(plan.fecha).toLocaleDateString('es-MX', { weekday: 'short' })}</span>
                                            <span className="text-lg font-black leading-none mt-0.5">{new Date(plan.fecha).getUTCDate()}</span>
                                        </div>
                                        <h3 className="text-lg font-black text-gray-900 capitalize">
                                            {new Date(plan.fecha).toLocaleDateString('es-MX', { month: 'long', timeZone: 'UTC' })}
                                        </h3>
                                    </div>
                                    {plan.fechaLimite && (
                                        <div className="text-right flex flex-col items-end">
                                            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1 flex items-center gap-1">
                                                Límite <Clock size={10} />
                                            </p>
                                            <p className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isLocked ? 'bg-red-50 text-red-500' : 'bg-[#EF9F27]/10 text-[#EF9F27]'}`}>
                                               {new Date(plan.fechaLimite).toLocaleString('es-MX', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'})}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Lista de Comidas */}
                                <div className="p-4 space-y-4 bg-gray-50/30">
                                   {['DESAYUNO', 'ALMUERZO', 'CENA'].map(tipo => {
                                       const menu = plan.menus.find((m: any) => m.tipo === tipo);
                                       if (!menu) {
                                           return (
                                               <div key={tipo} className="border-2 border-gray-100 border-dashed rounded-3xl overflow-hidden bg-gray-50/50 flex flex-col items-center justify-center py-8 opacity-60">
                                                   <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-gray-200 text-gray-400 mb-2 bg-white shadow-sm">
                                                       {TIPO_LABEL[tipo]}
                                                   </span>
                                                   <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Sin programación</p>
                                               </div>
                                           )
                                       }
                                       
                                       const miAsistencia = menu.asistencias.find((a: any) => a.residenteId === residenteId);
                                       const asiste = miAsistencia ? miAsistencia.asiste : true; // DEFAULT TRUE IMPLÍCITO
                                       
                                       return (
                                           <div key={menu.id} className="border border-gray-100 rounded-3xl overflow-hidden hover:border-[#1D9E75]/30 transition-colors bg-white shadow-sm flex flex-col h-full relative">
                                               <div className="p-5 flex-1">
                                                   <div className="flex items-center justify-between mb-3">
                                                       <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${TIPO_COLOR[menu.tipo] || 'bg-gray-50'}`}>
                                                            {TIPO_LABEL[menu.tipo] || menu.tipo}
                                                        </span>
                                                        {canManage && (
                                                            <div className="text-[10px] font-black text-[#1D9E75] bg-[#1D9E75]/10 px-2.5 py-1 rounded-md uppercase tracking-wider title='Total Activos menos Cancelaciones'">
                                                                {menu.totalConfirmados} Efectivas
                                                            </div>
                                                        )}
                                                   </div>
                                                   <h4 className="font-black text-gray-900 text-lg leading-tight group-hover:text-[#1D9E75] transition-colors">{menu.nombre}</h4>
                                                   {menu.descripcion && <p className="text-xs font-medium text-gray-400 mt-1">{menu.descripcion}</p>}
                                                   
                                                   {/* Residencias Asignadas */}
                                                   {canManage && menu.residencias && menu.residencias.length > 0 && (
                                                       <div className="mt-4 pt-3 border-t border-gray-50 flex flex-wrap gap-1.5">
                                                           {menu.residencias.map((r: any) => (
                                                               <span key={r.residenciaId} className="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded text-[8px] font-black uppercase text-gray-500 tracking-wider">
                                                                   {r.residencia.nombre}
                                                               </span>
                                                           ))}
                                                       </div>
                                                   )}
                                               </div>
                                               
                                               {!canManage && residenteId && (
                                                   <AsistenciaButtons 
                                                       residenteId={residenteId} 
                                                       menuId={menu.id} 
                                                       asiste={asiste} 
                                                       isLocked={isLocked}
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
