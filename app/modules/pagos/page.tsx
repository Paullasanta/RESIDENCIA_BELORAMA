import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { AsignarMontoForm } from '@/components/admin/AsignarMontoForm'
import { RevisionVouchers } from '@/components/admin/RevisionVouchers'
import { DollarSign, CheckCircle, Clock, AlertCircle, Eye, History, Bell, Calendar } from 'lucide-react'
import Link from 'next/link'
import ResidentPagoCard from '@/components/shared/ResidentPagoCard'

export default async function PagosPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
    const session = await auth()
    const { rol, permisos } = session!.user
    const isAdmin = rol === 'ADMIN' || permisos?.includes('MANAGE_PAYMENTS')
    const { filter } = await searchParams

    // Data fetching
    let pagosRaw: any[] = []
    let residentesActivos: any[] = []
    let vouchersPendientes: any[] = []
    
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

        residentesActivos = await prisma.residente.findMany({
            where: { activo: true },
            include: { user: true, habitacion: true },
            orderBy: { user: { nombre: 'asc' } }
        })

        vouchersPendientes = pagosRaw.filter(p => p.estado === 'EN_REVISION')
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

    // Grouping logic for Admin Table
    const groupedPagos = isAdmin ? pagosRaw.reduce((acc: any, current: any) => {
        const resId = current.residenteId
        if (!acc[resId]) {
            acc[resId] = {
                residente: current.residente,
                pagos: [],
                totalMonto: 0,
                totalPagado: 0,
                ultimoPago: current.estado === 'PAGADO' ? current.createdAt : null
            }
        }
        acc[resId].pagos.push(current)
        acc[resId].totalMonto += current.monto
        acc[resId].totalPagado += current.montoPagado
        if (current.estado === 'PAGADO' && (!acc[resId].ultimoPago || new Date(current.createdAt) > new Date(acc[resId].ultimoPago))) {
            acc[resId].ultimoPago = current.createdAt
        }
        return acc
    }, {}) : {}

    let residentesList = Object.values(groupedPagos)

    // Filtering logic
    if (filter === 'debtors') {
        residentesList = residentesList.filter((r: any) => (r.totalMonto - r.totalPagado) > 0)
    }

    const stats = isAdmin ? {
        t1: 'Total Recaudado',
        v1: pagosRaw.filter(p => p.estado === 'PAGADO').reduce((s, p) => s + p.montoPagado, 0),
        t2: 'Por Cobrar',
        v2: pagosRaw.reduce((s, p) => s + (p.monto - p.montoPagado), 0),
        t3: 'Revisión Pendiente',
        v3: vouchersPendientes.length
    } : {
        t1: 'Total Pagado',
        v1: pagosRaw.reduce((s, p) => s + p.montoPagado, 0),
        t2: 'Saldo Pendiente',
        v2: pagosRaw.reduce((s, p) => s + (p.monto - p.montoPagado), 0),
        t3: 'Próximo Vencimiento',
        v3: pagosRaw.find(p => p.estado !== 'PAGADO')?.cuotas.find((c:any) => !c.pagado)?.fechaVencimiento || '—'
    }

    const todayString = new Date().toLocaleDateString('es-MX', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
    })

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Top Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-4xl font-black text-[#072E1F] tracking-tighter">Pagos</h1>
                        <span className="px-3 py-1 bg-[#1D9E75]/10 text-[#1D9E75] rounded-lg text-[10px] font-black uppercase tracking-widest border border-[#1D9E75]/10">
                            {rol}
                        </span>
                    </div>
                    <p className="text-gray-400 font-bold text-sm">Estado de pagos — {new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</p>
                </div>
                
                <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm">
                    <Calendar size={18} className="text-[#1D9E75]" />
                    <span className="text-xs font-black text-gray-700 uppercase tracking-widest">{todayString}</span>
                </div>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link href="/modules/pagos" className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-gray-200/20 flex items-center gap-6 group hover:-translate-y-1 transition-all duration-300">
                    <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 border border-green-100 group-hover:scale-110 transition-transform">
                        <CheckCircle size={32} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">{stats.t1}</p>
                        <p className="text-3xl font-black text-[#072E1F] tracking-tighter">S/ {stats.v1.toLocaleString('es-MX')}</p>
                    </div>
                </Link>
                <Link href="/modules/pagos?filter=debtors" className={`bg-white rounded-[2.5rem] p-8 border shadow-xl shadow-gray-200/20 flex items-center gap-6 group hover:-translate-y-1 transition-all duration-300 ${filter === 'debtors' ? 'border-[#EF9F27] ring-4 ring-orange-50' : 'border-gray-100'}`}>
                    <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-[#EF9F27] border border-orange-100 group-hover:scale-110 transition-transform">
                        <Clock size={32} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">{stats.t2}</p>
                        <p className="text-3xl font-black text-[#072E1F] tracking-tighter">S/ {stats.v2.toLocaleString('es-MX')}</p>
                    </div>
                </Link>
                <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-gray-200/20 flex items-center gap-6 group hover:-translate-y-1 transition-all duration-300">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-all group-hover:scale-110 ${stats.v3 > 0 ? 'bg-red-50 text-red-500 border-red-100 animate-pulse' : 'bg-gray-50 text-gray-300 border-gray-100'}`}>
                        <Bell size={32} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">{stats.t3}</p>
                        <p className={`text-3xl font-black tracking-tighter ${stats.v3 > 0 ? 'text-red-600' : 'text-[#072E1F]'}`}>
                            {stats.v3 === '—' ? stats.v3 : typeof stats.v3 === 'number' ? stats.v3 : new Date(stats.v3).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Table Section (Admin) */}
            {isAdmin && (
                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/30 border border-gray-100 overflow-hidden">
                    <div className="px-10 py-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/20">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-black text-[#072E1F] tracking-tight">Estado general de residentes</h2>
                            {filter && (
                                <Link href="/modules/pagos" className="text-[10px] font-black text-[#EF9F27] uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full border border-orange-100 hover:bg-[#EF9F27] hover:text-white transition-all">
                                    Limpiar Filtro
                                </Link>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                             <StatusBadge status="PAGADO" />
                             <StatusBadge status="PENDIENTE" />
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">
                                    <th className="text-left px-10 py-6">Residente</th>
                                    <th className="text-left px-6 py-6">Ubicación</th>
                                    <th className="text-center px-6 py-6">Total Mes</th>
                                    <th className="text-center px-6 py-6">Recaudado</th>
                                    <th className="text-center px-6 py-6">Estado</th>
                                    <th className="text-center px-6 py-6">Fécha</th>
                                    <th className="text-right px-10 py-6">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {residentesList.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-10 py-20 text-center">
                                            <p className="text-gray-400 font-bold italic">No se encontraron residentes con el filtro aplicado.</p>
                                        </td>
                                    </tr>
                                ) : residentesList.map((entry: any) => {
                                    const pendiente = entry.totalMonto - entry.totalPagado
                                    const isHealthy = pendiente === 0
                                    
                                    return (
                                        <tr key={entry.residente.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-10 py-6">
                                                <p className="font-black text-[#072E1F] text-base">{entry.residente.user.nombre}</p>
                                            </td>
                                            <td className="px-6 py-6">
                                                <span className="px-3 py-1.5 bg-[#1D9E75]/5 text-[#1D9E75] rounded-xl text-[10px] font-black uppercase tracking-widest border border-[#1D9E75]/10">
                                                    Res {entry.residente.habitacion?.numero?.charAt(0) || 'D'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6 text-center font-black text-gray-700">
                                                S/ {entry.totalMonto.toLocaleString('es-MX')}
                                            </td>
                                            <td className="px-6 py-6 text-center font-black text-gray-900">
                                                S/ {entry.totalPagado.toLocaleString('es-MX')}
                                            </td>
                                            <td className="px-6 py-6 text-center uppercase">
                                                <StatusBadge status={isHealthy ? 'PAGADO' : 'PENDIENTE'} />
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <span className="text-[11px] font-bold text-gray-400 lowercase">
                                                    {entry.ultimoPago ? new Date(entry.ultimoPago).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : '—'}
                                                </span>
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {pendiente > 0 ? (
                                                        <button className="px-6 py-2 bg-red-50 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100 hover:bg-red-500 hover:text-white transition-all">
                                                            Recordar
                                                        </button>
                                                    ) : (
                                                        <Link
                                                            href={`/modules/pagos/${entry.pagos[0]?.id}`}
                                                            className="px-6 py-2 bg-[#1D9E75]/5 text-[#1D9E75] rounded-xl text-[10px] font-black uppercase tracking-widest border border-[#1D9E75]/10 hover:bg-[#1D9E75] hover:text-white transition-all"
                                                        >
                                                            Ver
                                                        </Link>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Bottom Grid: Form & Review Section (Admin Only) */}
            {isAdmin && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-4">
                        <AsignarMontoForm residentes={residentesActivos} />
                    </div>
                    <div className="lg:col-span-8">
                        <RevisionVouchers vouchers={vouchersPendientes} />
                    </div>
                </div>
            )}

            {/* Resident View (Alternative) */}
            {!isAdmin && (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {pagosRaw.map(pago => (
                        <ResidentPagoCard key={pago.id} pago={pago} />
                    ))}
                </div>
            )}
        </div>
    )
}
