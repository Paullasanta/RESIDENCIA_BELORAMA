import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { StatCard } from '@/components/shared/StatCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Users, DollarSign, WashingMachine, Megaphone } from 'lucide-react'

export default async function AdminDashboard() {
    const session = await auth()

    // Real data from DB
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
            include: {
                residente: { include: { user: true } },
            },
        }),
    ])

    const ingresosMes = pagosMes._sum.montoPagado ?? 0

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <PageHeader
                title="Dashboard Administrativo"
                description={`Bienvenido de nuevo, ${session?.user.nombre}. Aquí tienes un resumen.`}
            />

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Residentes"
                    value={totalResidentes}
                    color="green"
                    icon={<Users size={22} />}
                />
                <StatCard
                    label="Ingresos este Mes"
                    value={`$${ingresosMes.toLocaleString('es-MX')}`}
                    color="yellow"
                    icon={<DollarSign size={22} />}
                />
                <StatCard
                    label="Turnos Lavandería Ocupados"
                    value={turnosActivos}
                    color="teal"
                    icon={<WashingMachine size={22} />}
                />
                <StatCard
                    label="Publicaciones Activas"
                    value={publicacionesActivas}
                    color="dark"
                    icon={<Megaphone size={22} />}
                />
            </div>

            {/* Últimos Pagos */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-[#072E1F]">Últimos Pagos Registrados</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Los 6 pagos más recientes del sistema</p>
                </div>
                {ultimosPagos.length === 0 ? (
                    <div className="py-16 text-center text-gray-400 font-medium">
                        No hay pagos registrados aún.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {ultimosPagos.map((pago) => (
                            <div key={pago.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-[#1D9E75]/10 flex items-center justify-center text-[#1D9E75] font-bold text-sm">
                                        {pago.residente.user.nombre.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{pago.residente.user.nombre}</p>
                                        <p className="text-xs text-gray-500">{new Date(pago.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-bold text-gray-800">${pago.monto.toLocaleString('es-MX')}</span>
                                    <StatusBadge status={pago.estado as any} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <div className="border-t border-gray-100 px-6 py-3 bg-gray-50/50">
                    <a href="/admin/pagos" className="text-sm font-semibold text-[#1D9E75] hover:text-[#085041] transition-colors">
                        Ver todos los pagos →
                    </a>
                </div>
            </div>
        </div>
    )
}
