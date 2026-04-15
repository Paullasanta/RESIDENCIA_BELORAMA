import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react'

export default async function PagosResidentePage() {
    const session = await auth()

    const residente = await prisma.residente.findFirst({
        where: { user: { email: session!.user.email } },
        include: {
            pagos: {
                include: { cuotas: { orderBy: { fechaVencimiento: 'asc' } } },
                orderBy: { createdAt: 'desc' },
            },
        },
    })

    const pagos = residente?.pagos ?? []

    const totalDeuda = pagos.reduce((s, p) => s + (p.monto - p.montoPagado), 0)
    const totalPagado = pagos.reduce((s, p) => s + p.montoPagado, 0)
    const pagosPendientes = pagos.filter(p => p.estado !== 'PAGADO').length

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <PageHeader
                title="Mis Pagos"
                description="Estado de cuenta y cuotas pendientes."
            />

            {/* Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                        <CheckCircle size={22} className="text-green-600" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Pagado</p>
                        <p className="text-2xl font-extrabold text-green-600">${totalPagado.toLocaleString('es-MX')}</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                        <AlertCircle size={22} className="text-red-500" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Saldo Pendiente</p>
                        <p className="text-2xl font-extrabold text-red-500">${totalDeuda.toLocaleString('es-MX')}</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center shrink-0">
                        <Clock size={22} className="text-yellow-600" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Pagos Abiertos</p>
                        <p className="text-2xl font-extrabold text-yellow-600">{pagosPendientes}</p>
                    </div>
                </div>
            </div>

            {pagos.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <EmptyState
                        icon={<DollarSign size={48} />}
                        title="Sin pagos registrados"
                        description="Cuando el administrador registre tu pago, aparecerá aquí."
                    />
                </div>
            ) : (
                <div className="space-y-4">
                    {pagos.map(pago => {
                        const cuotasPagadas = pago.cuotas.filter(c => c.pagado).length
                        const progPct = pago.monto > 0 ? Math.round((pago.montoPagado / pago.monto) * 100) : 0

                        return (
                            <div key={pago.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-6 py-5 flex items-center justify-between flex-wrap gap-4">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <p className="font-bold text-gray-900 text-lg">${pago.monto.toLocaleString('es-MX')}</p>
                                            <StatusBadge status={pago.estado as any} />
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Registrado el {new Date(pago.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-gray-700">Pagado: ${pago.montoPagado.toLocaleString('es-MX')}</p>
                                        {pago.cuotas.length > 0 && (
                                            <p className="text-xs text-gray-400 mt-0.5">Cuotas: {cuotasPagadas}/{pago.cuotas.length}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="px-6 pb-3">
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${progPct === 100 ? 'bg-green-500' : progPct > 50 ? 'bg-[#1D9E75]' : 'bg-[#EF9F27]'}`}
                                            style={{ width: `${progPct}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1 text-right">{progPct}% completado</p>
                                </div>

                                {/* Cuotas */}
                                {pago.cuotas.length > 0 && (
                                    <div className="border-t border-gray-50 px-6 py-4">
                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Cuotas</p>
                                        <div className="space-y-2">
                                            {pago.cuotas.map((cuota, i) => (
                                                <div key={cuota.id} className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${cuota.pagado ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                                            {cuota.pagado ? '✓' : i + 1}
                                                        </span>
                                                        <span className="text-gray-600">Cuota {i + 1}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-gray-900 font-medium">${cuota.monto.toLocaleString('es-MX')}</span>
                                                        <span className="text-xs text-gray-400">
                                                            Vence: {new Date(cuota.fechaVencimiento).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
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
