import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { StatCard } from '@/components/shared/StatCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Users, DollarSign, WashingMachine, Megaphone, ShoppingBag, UtensilsCrossed } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
    const session = await auth()
    const { rol, nombre, email } = session!.user
    const isAdmin = rol === 'ADMIN'

    if (isAdmin) {
        const [totalResidentes, pagosMes, turnosActivos, publicacionesActivas, ultimosPagos] = await Promise.all([
            prisma.residente.count({ where: { activo: true } }),
            prisma.pago.aggregate({
                _sum: { montoPagado: true },
                where: {
                    createdAt: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    },
                },
            }),
            prisma.turnoLavanderia.count({ where: { estado: 'OCUPADO' } }),
            prisma.publicacionHabitacion.count({ where: { activa: true } }),
            prisma.pago.findMany({
                take: 6,
                orderBy: { createdAt: 'desc' },
                include: { residente: { include: { user: { select: { nombre: true, email: true } } } } }
            }),
        ])

        const ingresosMes = pagosMes._sum.montoPagado ?? 0

        return (
            <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
                <PageHeader
                    title="Panel de Control"
                    description={`Hola ${nombre}, aquí está el resumen global de las residencias.`}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard label="Residentes" value={totalResidentes} color="green" icon={<Users size={22} />} />
                    <StatCard label="Ingresos Mes" value={`$${ingresosMes.toLocaleString('es-MX')}`} color="yellow" icon={<DollarSign size={22} />} />
                    <StatCard label="Lavandería" value={turnosActivos} color="teal" icon={<WashingMachine size={22} />} />
                    <StatCard label="Publicaciones" value={publicacionesActivas} color="dark" icon={<Megaphone size={22} />} />
                </div>

                <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-black text-[#072E1F]">Actividad Reciente</h2>
                            <p className="text-sm text-gray-500">Últimos cobros registrados en el sistema.</p>
                        </div>
                        <Link href="/modules/pagos" className="text-sm font-black text-[#1D9E75] hover:underline">Ver todo</Link>
                    </div>
                    {ultimosPagos.length === 0 ? (
                        <div className="py-20 text-center text-gray-400 font-medium">No hay actividad reciente.</div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {ultimosPagos.map((pago: any) => (
                                <div key={pago.id} className="flex items-center justify-between px-8 py-5 hover:bg-gray-50/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-[#072E1F]">
                                            {pago.residente.user.nombre.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{pago.residente.user.nombre}</p>
                                            <p className="text-xs text-gray-400 font-medium">{new Date(pago.createdAt).toLocaleDateString('es-MX')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <span className="font-black text-gray-900">${pago.monto.toLocaleString('es-MX')}</span>
                                        <StatusBadge status={pago.estado as any} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
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

    return (
        <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <PageHeader
                title={`¡Bienvenido, ${nombre}!`}
                description={profile?.habitacion ? `Residente en ${profile.habitacion.residencia.nombre} — Hab. ${profile.habitacion.numero}` : 'Bienvenido a Belorama.'}
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
                            {profile?.pagos.map(p => (
                                <div key={p.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 border border-gray-50">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{new Date(p.createdAt).toLocaleDateString()}</span>
                                        <span className="font-black text-gray-900">${p.monto.toLocaleString()}</span>
                                    </div>
                                    <StatusBadge status={p.estado as any} />
                                </div>
                            ))}
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

            {/* Accesos Rápidos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <Link href="/modules/marketplace" className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-lg transition-all flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <ShoppingBag size={24} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">Marketplace</span>
                </Link>
                <Link href="/modules/comida" className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-lg transition-all flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                        <UtensilsCrossed size={24} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">Menús</span>
                </Link>
            </div>
        </div>
    )
}
