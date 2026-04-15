import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { DollarSign, Plus } from 'lucide-react'
import Link from 'next/link'

export default async function PagosPage() {
    const pagos = await prisma.pago.findMany({
        include: {
            residente: { include: { user: true } },
            cuotas: true,
        },
        orderBy: { createdAt: 'desc' },
    })

    const totales = {
        pagado: pagos.filter(p => p.estado === 'PAGADO').reduce((s, p) => s + p.montoPagado, 0),
        pendiente: pagos.filter(p => p.estado === 'PENDIENTE').reduce((s, p) => s + (p.monto - p.montoPagado), 0),
        parcial: pagos.filter(p => p.estado === 'PARCIAL').reduce((s, p) => s + (p.monto - p.montoPagado), 0),
    }

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <PageHeader
                title="Cobros y Pagos"
                description="Control de todos los pagos de residentes."
            >
                <Link
                    href="/admin/pagos/nuevo"
                    className="flex items-center gap-2 bg-[#EF9F27] hover:bg-[#d88c1c] text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-[#EF9F27]/20 text-sm"
                >
                    <Plus size={18} />
                    Registrar Cobro
                </Link>
            </PageHeader>

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Total Cobrado</p>
                    <p className="text-3xl font-extrabold text-[#1D9E75]">${totales.pagado.toLocaleString('es-MX')}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Por Cobrar (Parcial)</p>
                    <p className="text-3xl font-extrabold text-[#EF9F27]">${(totales.pendiente + totales.parcial).toLocaleString('es-MX')}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Total Registros</p>
                    <p className="text-3xl font-extrabold text-[#072E1F]">{pagos.length}</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {pagos.length === 0 ? (
                    <EmptyState
                        icon={<DollarSign size={48} />}
                        title="No hay pagos registrados"
                        description="Los pagos de residentes aparecerán aquí."
                    />
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/80">
                                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Residente</th>
                                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Monto Total</th>
                                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Pagado</th>
                                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Cuotas</th>
                                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Estado</th>
                                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Fecha</th>
                                <th className="text-right px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {pagos.map((pago) => {
                                const cuotasPagadas = pago.cuotas.filter(c => c.pagado).length
                                return (
                                    <tr key={pago.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#EF9F27]/10 flex items-center justify-center text-[#EF9F27] font-bold text-sm">
                                                    {pago.residente.user.nombre.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{pago.residente.user.nombre}</p>
                                                    <p className="text-xs text-gray-400">{pago.residente.user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-800">${pago.monto.toLocaleString('es-MX')}</td>
                                        <td className="px-6 py-4 text-gray-700">${pago.montoPagado.toLocaleString('es-MX')}</td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {pago.cuotas.length > 0
                                                ? `${cuotasPagadas}/${pago.cuotas.length}`
                                                : <span className="italic text-gray-400">—</span>
                                            }
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={pago.estado as any} />
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-xs">
                                            {new Date(pago.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/admin/pagos/${pago.id}`}
                                                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1D9E75] hover:bg-[#1D9E75]/10 px-3 py-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                Gestionar
                                            </Link>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
