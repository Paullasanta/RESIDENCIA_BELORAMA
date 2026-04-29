import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { WashingMachine, Clock } from 'lucide-react'
import { ShiftActions } from '@/components/admin/ShiftActions'
import { AddLavadoraButton } from '@/components/admin/AddLavadoraButton'
import { GenerateShiftsModal } from '@/components/admin/GenerateShiftsModal'
import { ResidenciaSelector } from '@/components/admin/ResidenciaSelector'

const DIAS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'] as const
const DIA_LABEL: Record<string, string> = {
    LUNES: 'Lunes', MARTES: 'Martes', MIERCOLES: 'Miércoles', 
    JUEVES: 'Jueves', VIERNES: 'Viernes', SABADO: 'Sábado', DOMINGO: 'Domingo',
}

export default async function LavanderiaPage({ searchParams }: { searchParams: Promise<any> }) {
    const session = await auth()
    const { rol, permisos, residenciaId: sessionResId } = session!.user
    const canManage = rol === 'ADMIN' || permisos?.includes('MANAGE_LAVANDERIA')
    
    // Obtener parámetro de búsqueda para filtro de admin
    const searchParamsObj = await (searchParams as any)
    const filterResidenciaId = searchParamsObj?.residenciaId ? parseInt(searchParamsObj.residenciaId) : null

    const isGlobalAdmin = rol === 'ADMIN' && !sessionResId

    // Aislamiento: Prioridad de residencia
    let residenciaId: number | null = filterResidenciaId || sessionResId || null
    
    if (rol === 'RESIDENTE') {
        const profile = await prisma.residente.findFirst({
            where: { user: { email: session!.user.email as string } },
            select: { habitacion: { select: { residenciaId: true } } }
        })
        residenciaId = profile?.habitacion?.residenciaId ?? sessionResId ?? null
    }

    const turnos = await prisma.turnoLavanderia.findMany({
        where: residenciaId ? { residenciaId } : (isGlobalAdmin ? {} : { residenciaId: -1 }),
        include: {
            lavadora: true,
            residente: { include: { user: true } },
        },
        orderBy: [{ dia: 'asc' }, { horaInicio: 'asc' }],
    })

    const lavadoras = await prisma.lavadora.findMany({
        where: residenciaId ? { residenciaId } : (isGlobalAdmin ? {} : { residenciaId: -1 }),
        include: { residencia: { select: { nombre: true } } },
        orderBy: { nombre: 'asc' }
    })
    
    const residentes = canManage ? await prisma.residente.findMany({
        where: residenciaId ? { user: { residenciaId } } : (isGlobalAdmin ? {} : { user: { residenciaId: -1 } }),
        include: { user: true },
        orderBy: { user: { nombre: 'asc' } }
    }) : []

    const residenciasConfig = canManage ? await prisma.residencia.findMany({
        select: { id: true, nombre: true },
        orderBy: { nombre: 'asc' }
    }) : []

    const turnosByLavadora = lavadoras.map(lav => ({
        lavadora: lav,
        days: DIAS.map(dia => ({
            dia,
            turnos: turnos.filter(t => t.lavadoraId === lav.id && t.dia === dia),
        })),
    }))

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <PageHeader
                    title="Gestión de Lavandería"
                    description={residenciaId ? `Panel de turnos para sede.` : "Monitoriza y asigna turnos de uso en todas las residencias."}
                />
                <div className="flex items-center gap-4">
                    {isGlobalAdmin && (
                        <ResidenciaSelector 
                            residencias={residenciasConfig} 
                            currentId={filterResidenciaId} 
                        />
                    )}
                    {canManage && <AddLavadoraButton residencias={residenciasConfig} />}
                </div>
            </div>

            {lavadoras.length === 0 ? (
                <EmptyState
                    icon={<WashingMachine size={48} />}
                    title="No hay infraestructura"
                    description="No se encontraron lavadoras configuradas para tu acceso."
                />
            ) : (
                <div className="grid grid-cols-1 gap-10">
                    {turnosByLavadora.map(({ lavadora, days }) => (
                        <div key={lavadora.id} className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                            <div className="px-8 py-6 bg-gradient-to-r from-[#072E1F] to-[#154a34] flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white backdrop-blur-md">
                                        <WashingMachine size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-black text-white">{lavadora.nombre}</h3>
                                            <span className="text-[10px] bg-white/20 text-white/80 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                {(lavadora as any).residencia.nombre}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`w-2 h-2 rounded-full ${lavadora.activa ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></span>
                                            <p className="text-white/60 text-xs font-bold uppercase tracking-widest">
                                                {lavadora.activa ? 'Operativa' : 'Fuera de Servicio'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {canManage && (
                                    <div className="flex bg-white/10 p-2 border border-white/20 rounded-xl">
                                        <GenerateShiftsModal lavadora={lavadora} />
                                    </div>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-7 divide-x divide-gray-50 bg-gray-50/30">
                                {days.map(({ dia, turnos: turnosDia }) => (
                                    <div key={dia} className="min-h-[200px] flex flex-col">
                                        <div className="px-4 py-4 bg-white border-b border-gray-50 text-center">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1D9E75] mb-0.5">{DIA_LABEL[dia].slice(0, 3)}</p>
                                            <p className="text-xs font-bold text-gray-400">{DIA_LABEL[dia]}</p>
                                        </div>
                                        <div className="p-3 space-y-3 flex-1">
                                            {turnosDia.length === 0 ? (
                                                <div className="h-full flex items-center justify-center py-10 opacity-20">
                                                    <Clock size={20} className="text-gray-400 rotate-12" />
                                                </div>
                                            ) : turnosDia.map((t: any) => {
                                                const esMio = t.residente?.user?.email === session?.user.email
                                                return (
                                                    <div key={t.id} className={`group relative rounded-2xl p-3 transition-all duration-300 border ${
                                                        esMio ? 'bg-[#EF9F27] border-transparent shadow shadow-[#EF9F27]/20' :
                                                        t.estado === 'LIBRE' 
                                                            ? 'bg-white border-gray-100 hover:border-[#1D9E75] hover:shadow-lg hover:shadow-[#1D9E75]/5' 
                                                            : 'bg-[#072E1F] border-transparent shadow-md'
                                                    }`}>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className={`text-[10px] font-black tracking-tight ${t.estado === 'LIBRE' ? 'text-[#1D9E75]' : 'text-white/50'}`}>
                                                                {t.horaInicio}
                                                            </span>
                                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                                                esMio ? 'bg-white text-[#EF9F27]' :
                                                                t.estado === 'LIBRE' ? 'bg-green-50 text-green-600' : 'bg-white/10 text-white'
                                                            }`}>
                                                                {esMio ? 'Mío' : t.estado}
                                                            </span>
                                                        </div>
                                                        
                                                        {t.residente ? (
                                                            <p className="text-[11px] font-bold text-white truncate mb-2">
                                                                {t.residente.user.nombre}
                                                            </p>
                                                        ) : (
                                                            <p className="text-[11px] font-medium text-gray-400 italic mb-2">Disponible</p>
                                                        )}

                                                        <ShiftActions turno={t} residentes={residentes} canManage={canManage} />
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
