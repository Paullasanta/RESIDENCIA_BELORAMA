import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { StatCard } from '@/components/shared/StatCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Users, DollarSign, WashingMachine, Megaphone, ShoppingBag, UtensilsCrossed } from 'lucide-react'
import Link from 'next/link'
import { DashboardActivity } from '@/components/admin/DashboardActivity'
import { DashboardCriticalDebts } from '@/components/admin/DashboardCriticalDebts'

export default async function DashboardPage() {
    const session = await auth()
    const { rol, nombre, email, residenciaId } = session!.user
    const isAnyAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(rol)
    const isGlobalAdmin = isAnyAdmin && !residenciaId

    // Auto-marcar pagos vencidos — usar UTC para no adelantar el vencimiento en timezones negativas
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    await prisma.pago.updateMany({
        where: {
            estado: 'PENDIENTE',
            fechaVencimiento: { lt: today }
        },
        data: { estado: 'VENCIDO' }
    })

    if (isAnyAdmin) {
        const whereResidenteResidencia = isGlobalAdmin ? {} : { user: { residenciaId: residenciaId || -1 } }
        const wherePagoResidencia = isGlobalAdmin ? {} : { residente: { user: { residenciaId: residenciaId || -1 } } }

        const [totalResidentes, pagosMes, turnosActivos, publicacionesActivas, ultimosPagos, pagosCriticos] = await Promise.all([
            prisma.residente.count({ 
                where: { 
                    activo: true,
                    ...whereResidenteResidencia
                } 
            }),
            prisma.pago.aggregate({
                _sum: { montoPagado: true },
                where: {
                    createdAt: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    },
                    ...wherePagoResidencia
                },
            }),
            prisma.turnoLavanderia.count({ 
                where: { 
                    estado: 'OCUPADO',
                    ...(isGlobalAdmin ? {} : { residenciaId: residenciaId || -1 })
                } 
            }),
            prisma.publicacionHabitacion.count({ 
                where: { 
                    activa: true,
                    ...(isGlobalAdmin ? {} : { residenciaId: residenciaId || -1 })
                } 
            }),
            prisma.pago.findMany({
                where: wherePagoResidencia,
                take: 15, // Solo lo más reciente (3 páginas de 5)
                orderBy: { createdAt: 'desc' },
                include: { residente: { include: { user: { select: { nombre: true, email: true } } } } }
            }),
            prisma.pago.findMany({
                where: {
                    AND: [
                        {
                            OR: [
                                { estado: 'CRITICO' },
                                { 
                                    estado: 'VENCIDO',
                                    fechaVencimiento: { lt: today }
                                }
                            ]
                        },
                        wherePagoResidencia
                    ]
                },
                // Quitamos el take para mostrar TODOS los vencidos como pediste
                orderBy: { fechaVencimiento: 'asc' },
                include: { residente: { include: { user: true } } }
            })
        ])

        const ingresosMes = pagosMes._sum.montoPagado ?? 0

        return (
            <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
                <PageHeader
                    title="Panel de Control"
                    description={`Hola ${nombre}, aquí está el resumen global de las residencias.`}
                />

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                    <StatCard label="Residentes" value={totalResidentes} color="green" icon={<Users size={18} />} />
                    <StatCard label="Ingresos" value={`$${ingresosMes.toLocaleString('es-MX')}`} color="yellow" icon={<DollarSign size={18} />} />
                    <StatCard label="Lavado" value={turnosActivos} color="teal" icon={<WashingMachine size={18} />} />
                    <StatCard label="Avisos" value={publicacionesActivas} color="dark" icon={<Megaphone size={18} />} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <DashboardActivity pagos={ultimosPagos} today={today} />
                    <DashboardCriticalDebts pagos={pagosCriticos} />
                </div>
            </div>
        )
    }

    // RESIDENTE Dashboard
    const profile = await prisma.residente.findFirst({
        where: { user: { email: email as string } },
        include: {
            habitacion: { include: { residencia: true } },
            pagos: { take: 3, orderBy: { createdAt: 'desc' } },
            turnos: { where: { estado: 'OCUPADO' }, include: { lavadora: true }, take: 2 }
        }
    })

    const avisos = await prisma.aviso.findMany({
        where: { residenciaId: profile?.habitacion?.residenciaId || residenciaId || -1 },
        take: 2,
        orderBy: { createdAt: 'desc' },
        include: { autor: true }
    })

    return (
        <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <PageHeader
                title={`¡Bienvenido, ${nombre}!`}
                description={profile?.habitacion ? `Residente en ${profile.habitacion.residencia.nombre} — Hab. ${profile.habitacion.numero}` : 'Bienvenido a Grow Residencial.'}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Saldo y Pagos */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-100 border border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-black text-[#072E1F]">Mi Estado Financiero</h2>
                        <Link href="/modules/pagos" className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                            <DollarSign size={20} className="text-[#1D9E75]" />
                        </Link>
                    </div>
                    {profile?.pagos.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">No tienes pagos registrados aún.</p>
                    ) : (
                        <div className="space-y-4">
                             {profile?.pagos.map(p => {
                                const fVenc = new Date(p.fechaVencimiento!)
                                fVenc.setUTCHours(0,0,0,0)
                                const dDiff = Math.ceil((fVenc.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                                const isPorVencer = (p.estado === 'PENDIENTE' || p.estado === 'VENCIDO') && dDiff >= 0 && dDiff <= 3
                                
                                const isGuarantee = p.concepto?.toLowerCase().includes('garantía') || p.concepto?.toLowerCase().includes('garantia')
                                const isFirstGuarantee = isGuarantee && (p.concepto?.includes('Cuota 1/') || !p.concepto?.includes('Cuota'))
                                
                                const fechaIngreso = profile?.fechaIngreso ? new Date(profile.fechaIngreso) : null
                                let isFirstMonth = false
                                if (fechaIngreso && p.mesCorrespondiente) {
                                    const firstMonthStr = `${fechaIngreso.getUTCFullYear()}-${String(fechaIngreso.getUTCMonth() + 1).padStart(2, '0')}`
                                    if (p.mesCorrespondiente === firstMonthStr) {
                                        isFirstMonth = true
                                    }
                                }

                                const isLocked = dDiff > 15 && p.estado === 'PENDIENTE' && !isFirstMonth && !isFirstGuarantee
                                const statusVis = isLocked ? 'PROXIMO' : (isPorVencer ? 'POR_VENCER' : p.estado)

                                return (
                                    <div key={p.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 border border-gray-50">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                                {p.concepto} — {new Date(p.fechaVencimiento!).toLocaleDateString('es-MX', { timeZone: 'UTC' })}
                                            </span>
                                            <span className="font-black text-gray-900">${p.monto.toLocaleString()}</span>
                                        </div>
                                        <StatusBadge status={statusVis as any} />
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Turnos Lavandería */}
                <div className="bg-[#072E1F] rounded-[2.5rem] p-8 shadow-2xl text-white">
                    <h2 className="text-xl font-black mb-6">Mis Turnos</h2>
                    {profile?.turnos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 opacity-30">
                            <WashingMachine size={48} className="mb-4" />
                            <p className="text-sm font-bold">Sin turnos activos</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {profile?.turnos.map(t => (
                                <div key={t.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                    <p className="text-[10px] font-black uppercase text-[#1D9E75] mb-1">{t.dia}</p>
                                    <p className="text-lg font-black leading-tight">{t.horaInicio} – {t.horaFin}</p>
                                    <p className="text-xs text-white/60 mt-1">{t.lavadora.nombre}</p>
                                </div>
                            ))}
                        </div>
                    )}
                    <Link href="/modules/lavanderia" className="mt-8 w-full block py-4 bg-[#1D9E75] hover:bg-[#154a34] text-center rounded-2xl font-black text-sm transition-all shadow-lg shadow-black/20">
                        VER TODOS LOS TURNOS
                    </Link>
                </div>
            </div>

            {/* Sección Inferior: Avisos y Accesos Rápidos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Últimos Avisos */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-black text-[#072E1F]">Últimos Avisos</h2>
                    {avisos.length === 0 ? (
                        <div className="p-10 bg-gray-50 rounded-[2rem] text-center text-gray-400 font-medium border border-dashed border-gray-200">
                            No hay avisos recientes en tu residencia.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {avisos.map(aviso => (
                                <div key={aviso.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-50 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase ${
                                                aviso.prioridad === 'URGENTE' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                            }`}>
                                                {aviso.prioridad}
                                            </span>
                                            <span className="text-[9px] font-bold text-gray-400">{new Date(aviso.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className="font-black text-gray-900 mb-2 leading-tight">{aviso.titulo}</h3>
                                        <p className="text-xs text-gray-500 line-clamp-2 mb-4">{aviso.contenido}</p>
                                    </div>
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-[#1D9E75]/10 text-[#1D9E75] flex items-center justify-center text-[10px] font-bold">
                                                {aviso.autor.nombre.charAt(0)}
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-600">{aviso.autor.nombre}</span>
                                        </div>
                                        <Link href="/modules/avisos" className="text-[10px] font-black text-[#1D9E75] hover:underline">LEER MÁS</Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Accesos Rápidos */}
                <div className="space-y-6">
                    <h2 className="text-xl font-black text-[#072E1F]">Accesos Rápidos</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <Link href="/modules/marketplace" className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-lg transition-all flex flex-col items-center text-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <ShoppingBag size={20} />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Marketplace</span>
                        </Link>
                        <Link href="/modules/comida" className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-lg transition-all flex flex-col items-center text-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                                <UtensilsCrossed size={20} />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Menús</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
