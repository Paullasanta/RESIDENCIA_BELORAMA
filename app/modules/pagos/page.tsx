import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { DollarSign, Plus, CheckCircle, Clock, AlertCircle, Eye, History, MoreVertical } from 'lucide-react'
import Link from 'next/link'

export default async function PagosPage() {
    const session = await auth()
    const { rol, permisos } = session!.user
    const isAdmin = rol === 'ADMIN' || permisos?.includes('MANAGE_PAYMENTS')

    // Data fetching depends on role
    let pagosRaw: any[] = []
    
    if (isAdmin) {
        pagosRaw = await prisma.pago.findMany({
            include: {
                residente: { 
                    include: { 
                        user: { select: { nombre: true, email: true } },
                        habitacion: { include: { residencia: true } }
                    } 
                },
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
        pagosRaw = (residente as any)?.pagos ?? []
    }

    // Grouping logic for Admin
    const groupedPagos = isAdmin ? pagosRaw.reduce((acc: any, current: any) => {
        const resId = current.residenteId
        if (!acc[resId]) {
            acc[resId] = {
                residente: current.residente,
                pagos: [],
                totalMonto: 0,
                totalPagado: 0,
                ultimoEstado: 'PENDIENTE'
            }
        }
        acc[resId].pagos.push(current)
        acc[resId].totalMonto += current.monto
        acc[resId].totalPagado += current.montoPagado
        return acc
    }, {}) : {}

    const residentesList = Object.values(groupedPagos)

    // Stats calculations
    const stats = isAdmin ? {
        t1: 'Total Cobrado',
        v1: pagosRaw.filter(p => p.estado === 'PAGADO').reduce((s, p) => s + p.montoPagado, 0),
        t2: 'Por Cobrar',
        v2: pagosRaw.reduce((s, p) => s + (p.monto - p.montoPagado), 0),
        t3: 'Residentes Activos',
        v3: residentesList.length
    } : {
        t1: 'Total Pagado',
        v1: pagosRaw.reduce((s, p) => s + p.montoPagado, 0),
        t2: 'Saldo Pendiente',
        v2: pagosRaw.reduce((s, p) => s + (p.monto - p.montoPagado), 0),
        t3: 'Pagos Abiertos',
        v3: pagosRaw.filter(p => p.estado !== 'PAGADO').length
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
                        className="flex items-center gap-2 bg-[#EF9F27] hover:bg-[#d88c1c] text-white px-6 py-3 rounded-[1.25rem] font-black transition-all shadow-xl shadow-[#EF9F27]/20 text-sm"
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
                        <p className="text-3xl font-black text-gray-900 tracking-tighter">${stats.v1.toLocaleString('es-MX')}</p>
                    </div>
                </div>
                <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm flex items-center gap-6">
                    <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 shadow-sm border border-red-100">
                        <AlertCircle size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">{stats.t2}</p>
                        <p className="text-3xl font-black text-gray-900 tracking-tighter">${stats.v2.toLocaleString('es-MX')}</p>
                    </div>
                </div>
                <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm flex items-center gap-6">
                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-600 shadow-sm border border-gray-100">
                        <Clock size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">{stats.t3}</p>
                        <p className="text-3xl font-black text-gray-900 tracking-tighter">{stats.v3}</p>
                    </div>
                </div>
            </div>

            {/* Content Logic */}
            {pagosRaw.length === 0 ? (
                <EmptyState
                    icon={<DollarSign size={64} />}
                    title="No hay actividad financiera"
                    description="Los cobros y pagos aparecerán aquí una vez registrados."
                />
            ) : isAdmin ? (
                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/40 border border-gray-100 overflow-x-auto">
                    <table className="w-full text-sm min-w-[900px]">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/30">
                                <th className="text-left px-6 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Residente</th>
                                <th className="text-left px-6 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Deuda Total</th>
                                <th className="text-left px-6 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Cobrado</th>
                                <th className="text-left px-6 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Pendiente</th>
                                <th className="text-left px-6 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Estado Gral.</th>
                                <th className="text-right px-6 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {residentesList.map((entry: any) => {
                                const pendiente = entry.totalMonto - entry.totalPagado
                                const isHealthy = pendiente === 0
                                
                                return (
                                    <tr key={entry.residente.id} className="hover:bg-gray-50/50 transition-all group">
                                        <td className="px-6 py-7">
                                            <div className="flex items-center gap-5 relative group/name p-2 -ml-2 rounded-2xl hover:bg-gray-50 transition-colors w-max cursor-pointer">
                                                <div className="w-12 h-12 rounded-2xl bg-[#EF9F27]/10 flex items-center justify-center text-[#EF9F27] font-black text-sm group-hover/name:scale-110 transition-transform duration-300">
                                                    {entry.residente.user.nombre.charAt(0)}
                                                </div>
                                                
                                                <div>
                                                    <p className="font-black text-gray-900 text-base leading-none mb-2">{entry.residente.user.nombre}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-[#EF9F27] font-black uppercase tracking-widest bg-[#EF9F27]/5 px-2 py-0.5 rounded-md">
                                                            Hab. {entry.residente.habitacion?.numero || '—'}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 font-bold">
                                                            {entry.residente.habitacion?.residencia?.nombre || 'Particular'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Hover History Tooltip */}
                                                <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 z-50 opacity-0 invisible group-hover/name:opacity-100 group-hover/name:visible transition-all duration-300 transform translate-y-2 group-hover/name:translate-y-0 cursor-default">
                                                    <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-3">
                                                        <History size={16} className="text-[#EF9F27]" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Historial de Pagos</span>
                                                    </div>
                                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                                        {entry.pagos.map((p: any) => (
                                                            <Link href={`/modules/pagos/${p.id}`} key={p.id} className="flex flex-col gap-1.5 p-3 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all group/item">
                                                                <div className="flex justify-between items-center text-xs font-black">
                                                                    <span className="text-gray-700 truncate max-w-[140px] group-hover/item:text-[#1D9E75] transition-colors">{p.concepto}</span>
                                                                    <span className={p.estado === 'PAGADO' ? 'text-[#1D9E75]' : 'text-red-400'}>
                                                                        ${p.monto.toLocaleString('es-MX')}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between text-[10px] font-bold text-gray-400 items-center mt-1">
                                                                    <span>{new Date(p.createdAt).toLocaleDateString('es-MX')}</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="uppercase tracking-widest">{p.estado}</span>
                                                                        <span className="text-[#1D9E75] opacity-0 group-hover/item:opacity-100 transition-opacity font-black">Gestionar &rarr;</span>
                                                                    </div>
                                                                </div>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-7 font-black text-gray-900 tracking-tighter text-base">
                                            ${entry.totalMonto.toLocaleString('es-MX')}
                                        </td>
                                        <td className="px-6 py-7 font-bold text-[#1D9E75] tracking-tight">
                                            ${entry.totalPagado.toLocaleString('es-MX')}
                                        </td>
                                        <td className="px-6 py-7">
                                            <span className={`font-black tracking-tighter text-base ${pendiente > 0 ? 'text-red-500' : 'text-gray-300'}`}>
                                                ${pendiente.toLocaleString('es-MX')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-7">
                                            <StatusBadge status={isHealthy ? 'PAGADO' : 'PENDIENTE'} />
                                        </td>
                                        <td className="px-6 py-7 text-right">
                                            <div className="flex justify-end items-center gap-2 relative group/actions">
                                                
                                                {/* CSS Dropdown Trigger Button */}
                                                <button className="px-5 py-2.5 rounded-xl border border-[#1D9E75] text-xs font-black text-[#1D9E75] hover:bg-[#1D9E75] hover:text-white transition-all shadow-sm flex items-center gap-2 uppercase whitespace-nowrap">
                                                    GESTIONAR
                                                </button>

                                                {/* CSS Dropdown for payments */}
                                                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 opacity-0 invisible group-hover/actions:opacity-100 group-hover/actions:visible transition-all text-left">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#EF9F27] px-3 py-2 border-b border-gray-50 mb-1">Pagos Activos ({entry.pagos.length})</p>
                                                    {entry.pagos.map((p: any) => (
                                                        <Link key={p.id} href={`/modules/pagos/${p.id}`} className="flex items-center justify-between px-3 py-2.5 text-xs font-bold text-gray-600 hover:bg-[#1D9E75] hover:text-white rounded-xl transition-colors">
                                                            <span className="truncate pr-2">{p.concepto}</span>
                                                            <Eye size={14} className="shrink-0 opacity-50" />
                                                        </Link>
                                                    ))}
                                                    <Link
                                                        href={`/modules/pagos/nuevo`}
                                                        className="flex items-center justify-between px-3 py-2.5 text-[10px] font-black text-[#EF9F27] hover:bg-[#EF9F27]/10 rounded-xl transition-colors mt-1 uppercase"
                                                    >
                                                        <span>Registrar Nuevo...</span>
                                                        <Plus size={14} className="shrink-0" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {pagosRaw.map(pago => {
                         const progPct = pago.monto > 0 ? Math.round((pago.montoPagado / pago.monto) * 100) : 0
                         return (
                            <div key={pago.id} className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden flex flex-col group hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                                <div className="p-10 pb-6">
                                    <div className="flex items-start justify-between mb-8">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[#EF9F27]">{pago.concepto}</p>
                                            <p className="text-4xl font-black text-gray-900 tracking-tighter">${pago.monto.toLocaleString('es-MX')}</p>
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

                                <div className="mt-auto px-10 py-6 bg-gray-50/30 border-t border-gray-50 flex items-center justify-between group-hover:bg-white transition-colors">
                                     <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                         Vencido el {new Date(pago.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}
                                     </div>
                                     <button className="flex items-center gap-2 text-[10px] font-black text-[#1D9E75] hover:text-[#072E1F] uppercase tracking-widest transition-all">
                                         Ver Cuotas <Eye size={14} />
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
