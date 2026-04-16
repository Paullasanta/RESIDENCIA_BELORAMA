import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { DollarSign, Plus, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default async function PagosPage() {
    const session = await auth()
    const { rol, permisos } = session!.user
    const isAdmin = rol === 'ADMIN' || permisos?.includes('MANAGE_PAYMENTS')

    // Data fetching depends on role
    let pagos: any[] = []
    
    if (isAdmin) {
        pagos = await prisma.pago.findMany({
            include: {
                residente: { include: { user: { select: { nombre: true, email: true } } } },
                cuotas: true,
            },
            orderBy: { createdAt: 'desc' },
        })
    } else {
        const residente = await prisma.residente.findFirst({
            where: { user: { email: session!.user.email as string } },
            include: {
                pagos: {
                    include: { cuotas: { orderBy: { fechaVencimiento: 'asc' } } },
                    orderBy: { createdAt: 'desc' },
                },
            },
        })
        pagos = (residente as any)?.pagos ?? []
    }

    // Stats calculations
    const stats = isAdmin ? {
        t1: 'Total Cobrado',
        v1: pagos.filter(p => p.estado === 'PAGADO').reduce((s, p) => s + p.montoPagado, 0),
        t2: 'Por Cobrar',
        v2: pagos.reduce((s, p) => s + (p.monto - p.montoPagado), 0),
        t3: 'Total Registros',
        v3: pagos.length
    } : {
        t1: 'Total Pagado',
        v1: pagos.reduce((s, p) => s + p.montoPagado, 0),
        t2: 'Saldo Pendiente',
        v2: pagos.reduce((s, p) => s + (p.monto - p.montoPagado), 0),
        t3: 'Pagos Abiertos',
        v3: pagos.filter(p => p.estado !== 'PAGADO').length
    }

    return (
        <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <PageHeader
                    title={isAdmin ? "Caja y Finanzas" : "Mis Pagos"}
                    description={isAdmin ? "Control global de ingresos y deudas de residentes." : "Estado de cuenta y cronograma de pagos."}
                />
                {isAdmin && (
                    <Link
                        href="/modules/pagos/nuevo"
                        className="flex items-center gap-2 bg-[#EF9F27] hover:bg-[#d88c1c] text-white px-6 py-3 rounded-2xl font-black transition-all shadow-xl shadow-[#EF9F27]/20 text-sm"
                    >
                        <Plus size={18} />
                        Registrar Cobro
                    </Link>
                )}
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm flex items-center gap-6">
                    <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 shadow-sm border border-green-100">
                        <CheckCircle size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">{stats.t1}</p>
                        <p className="text-3xl font-black text-gray-900">${stats.v1.toLocaleString('es-MX')}</p>
                    </div>
                </div>
                <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm flex items-center gap-6">
                    <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 shadow-sm border border-red-100">
                        <AlertCircle size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">{stats.t2}</p>
                        <p className="text-3xl font-black text-gray-900">${stats.v2.toLocaleString('es-MX')}</p>
                    </div>
                </div>
                <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm flex items-center gap-6">
                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-600 shadow-sm border border-gray-100">
                        <Clock size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">{stats.t3}</p>
                        <p className="text-3xl font-black text-gray-900">{stats.v3}</p>
                    </div>
                </div>
            </div>

            {/* Content Logic */}
            {pagos.length === 0 ? (
                <EmptyState
                    icon={<DollarSign size={64} />}
                    title="No hay actividad financiera"
                    description="Los cobros y pagos aparecerán aquí una vez registrados."
                />
            ) : isAdmin ? (
                <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/30">
                                <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Residente</th>
                                <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Total</th>
                                <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Pagado</th>
                                <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Estado</th>
                                <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Fecha</th>
                                <th className="text-right px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {pagos.map((pago: any) => (
                                <tr key={pago.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#EF9F27]/10 flex items-center justify-center text-[#EF9F27] font-black">
                                                {pago.residente.user.nombre.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{pago.residente.user.nombre}</p>
                                                <p className="text-xs text-gray-400 font-medium">{pago.residente.user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 font-black text-gray-900">${pago.monto.toLocaleString('es-MX')}</td>
                                    <td className="px-8 py-5 font-bold text-[#1D9E75]">${pago.montoPagado.toLocaleString('es-MX')}</td>
                                    <td className="px-8 py-5">
                                        <StatusBadge status={pago.estado as any} />
                                    </td>
                                    <td className="px-8 py-5 text-gray-400 text-xs font-bold uppercase tracking-tighter">
                                        {new Date(pago.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <Link
                                            href={`/pagos/${pago.id}`}
                                            className="inline-flex h-9 items-center justify-center px-4 rounded-xl text-xs font-black bg-gray-100 text-gray-600 hover:bg-[#1D9E75] hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            MODIFICAR
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {pagos.map(pago => {
                         const progPct = pago.monto > 0 ? Math.round((pago.montoPagado / pago.monto) * 100) : 0
                         return (
                            <div key={pago.id} className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden flex flex-col">
                                <div className="p-8 pb-4">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[#EF9F27]">Registro de Pago</p>
                                            <p className="text-3xl font-black text-gray-900 tracking-tighter">${pago.monto.toLocaleString('es-MX')}</p>
                                        </div>
                                        <StatusBadge status={pago.estado as any} />
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <p className="text-xs font-bold text-gray-500">Progreso del pago</p>
                                            <p className="text-xs font-black text-[#1D9E75]">{progPct}%</p>
                                        </div>
                                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden p-0.5">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${progPct === 100 ? 'bg-green-500' : 'bg-[#1D9E75]'}`}
                                                style={{ width: `${progPct}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto px-8 py-6 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
                                     <div className="text-xs font-bold text-gray-400">
                                         Vencido el {new Date(pago.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}
                                     </div>
                                     <button className="text-[10px] font-black text-[#1D9E75] hover:underline uppercase tracking-widest">
                                         Ver Cuotas →
                                     </button>
                                </div>
                            </div>
                         )
                    })}
                </div>
            )}
        </div>
    )
}
