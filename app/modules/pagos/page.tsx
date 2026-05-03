import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { RevisionVouchers } from '@/components/admin/RevisionVouchers'
import { DollarSign, CheckCircle, Clock, AlertCircle, Eye, History, Bell, Calendar as CalendarIcon, Filter } from 'lucide-react'
import Link from 'next/link'
import ResidentPagoCard from '@/components/shared/ResidentPagoCard'
import { PagosExportActions } from '@/components/admin/PagosExportActions'
import { PagosDateFilters } from '@/components/admin/PagosDateFilters'
import { GeneralPagination } from '@/components/shared/GeneralPagination'
import { PagosSearchFilters } from '@/components/admin/PagosSearchFilters'
import { RecordarButton } from '@/components/admin/RecordarButton'

const months = [
    { v: '01', l: 'Enero' }, { v: '02', l: 'Febrero' }, { v: '03', l: 'Marzo' },
    { v: '04', l: 'Abril' }, { v: '05', l: 'Mayo' }, { v: '06', l: 'Junio' },
    { v: '07', l: 'Julio' }, { v: '08', l: 'Agosto' }, { v: '09', l: 'Septiembre' },
    { v: '10', l: 'Octubre' }, { v: '11', l: 'Noviembre' }, { v: '12', l: 'Diciembre' }
]

export default async function PagosPage({ searchParams }: { 
    searchParams: Promise<{ 
        filter?: string,
        month?: string,
        year?: string,
        fromMonth?: string,
        fromYear?: string,
        toMonth?: string,
        toYear?: string,
        page?: string,
        limit?: string,
        q?: string,
        resId?: string
    }> 
}) {
    const session = await auth()
    const { rol, permisos, residenciaId, nombre } = session!.user
    const isAdmin = rol === 'ADMIN' || permisos?.includes('MANAGE_PAYMENTS')
    const isGlobalAdmin = rol === 'ADMIN' && !residenciaId
    const params = await searchParams
    const { filter, month, year, fromMonth, fromYear, toMonth, toYear, q, resId } = params
    const page = parseInt(params.page || '1')
    const limit = parseInt(params.limit || '10')

    // Fetch residencias for filter
    const residencias = isGlobalAdmin ? await prisma.residencia.findMany({ select: { id: true, nombre: true } }) : []

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

    // Construir filtro de fecha para la consulta
    let dateWhere: any = {}
    const filterMonth = month
    const filterYear = year

    if (fromMonth && fromYear && toMonth && toYear) {
        const start = new Date(parseInt(fromYear), parseInt(fromMonth) - 1, 1)
        const end = new Date(parseInt(toYear), parseInt(toMonth), 0, 23, 59, 59)
        dateWhere = { fechaVencimiento: { gte: start, lte: end } }
    } else if (isAdmin && filterMonth && filterYear) {
        // Solo si hay filtro explícito limitamos a ese mes
        const start = new Date(parseInt(filterYear), parseInt(filterMonth) - 1, 1)
        const end = new Date(parseInt(filterYear), parseInt(filterMonth), 0, 23, 59, 59)
        dateWhere = { fechaVencimiento: { gte: start, lte: end } }
    }

    // Data fetching
    let pagosRaw: any[] = []
    let vouchersPendientes: any[] = []
    
    if (isAdmin) {
        pagosRaw = await prisma.pago.findMany({
            where: {
                ...(isGlobalAdmin ? {} : { residente: { user: { residenciaId: residenciaId || -1 } } }),
                ...dateWhere
            },
            include: {
                residente: { 
                    include: { 
                        user: { select: { nombre: true, email: true } },
                        habitacion: { include: { residencia: true } }
                    } 
                },
            },
            orderBy: { fechaVencimiento: 'asc' },
        })

        vouchersPendientes = await prisma.pago.findMany({
            where: {
                estado: 'EN_REVISION',
                ...(isGlobalAdmin ? {} : { residente: { user: { residenciaId: residenciaId || -1 } } })
            },
            include: { residente: { include: { user: true } } }
        })
    } else {
        const residente = await prisma.residente.findFirst({
            where: { user: { email: session!.user.email as string } },
            include: {
                pagos: {
                    where: dateWhere,
                    orderBy: { fechaVencimiento: 'asc' },
                },
            },
        })
        pagosRaw = (residente as any)?.pagos?.map((p: any) => ({ ...p, residente })) ?? []
    }

    // Filtrar pagos para el RESIDENTE (limpiar historial viejo)
    // El ADMIN sigue viendo todo el historial
    if (!isAdmin) {
        pagosRaw = pagosRaw.filter((p: any) => {
            const res = p.residente || { fechaIngreso: (pagosRaw[0] as any)?.residente?.fechaIngreso }
            if (!res?.fechaIngreso) return p.estado !== 'RECHAZADO'
            const fV = new Date(p.fechaVencimiento || p.createdAt)
            const fI = new Date(res.fechaIngreso)
            fI.setUTCDate(1)
            fI.setUTCHours(0, 0, 0, 0)
            fV.setUTCHours(12, 0, 0, 0)
            // Para el residente, ocultamos RECHAZADO y registros antes de su ingreso
            return fV >= fI && p.estado !== 'RECHAZADO'
        })
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
                urgencia: 0
            }
        }
        const fV = new Date(current.fechaVencimiento || current.createdAt); fV.setUTCHours(12,0,0,0)
        const fI = new Date(current.residente?.fechaIngreso || 0)
        fI.setUTCDate(1); fI.setUTCHours(0,0,0,0)
        const isCurrentStay = fV >= fI

        if (current.estado !== 'RECHAZADO') {
            acc[resId].pagos.push(current)
            acc[resId].totalMonto += current.monto
            acc[resId].totalPagado += current.montoPagado
        }
        
        // Calcular urgencia para ordenamiento
        const diff = Math.ceil((fV.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        const isPV = (current.estado === 'PENDIENTE' || current.estado === 'VENCIDO') && diff >= 0 && diff <= 3
        
        let weight = 0
        if (isPV) weight = 100
        else if (current.estado === 'VENCIDO') weight = 90
        else if (current.estado === 'CRITICO') weight = 80
        else if (current.estado === 'PENDIENTE') weight = 50
        
        if (weight > acc[resId].urgencia) {
            acc[resId].urgencia = weight
        }
        
        // Mantener la fecha más antigua de pago pendiente/vencido para el ordenamiento secundario
        const fVTime = fV.getTime()
        if (!acc[resId].minFecha || (current.estado !== 'PAGADO' && fVTime < acc[resId].minFecha)) {
            acc[resId].minFecha = fVTime
        }

        return acc
    }, {}) : {}

    let residentesList = Object.values(groupedPagos)

    // Filtering logic
    if (filter === 'debtors') {
        residentesList = residentesList.filter((r: any) => (r.totalMonto - r.totalPagado) > 0)
    }

    if (q) {
        const query = q.toLowerCase()
        residentesList = residentesList.filter((r: any) => 
            r.residente.user.nombre.toLowerCase().includes(query) || 
            r.residente.user.email.toLowerCase().includes(query)
        )
    }

    if (resId) {
        residentesList = residentesList.filter((r: any) => r.residente.habitacion?.residenciaId === parseInt(resId))
    }

    // Ordenar por fecha (más antigua primero)
    residentesList.sort((a: any, b: any) => (a.minFecha || 0) - (b.minFecha || 0))

    // Pagination
    const totalItems = residentesList.length
    const paginatedList = residentesList.slice((page - 1) * limit, page * limit)

    const stats = isAdmin ? {
        t1: 'Total Recaudado',
        v1: pagosRaw.filter(p => p.estado === 'PAGADO').reduce((s, p) => s + p.montoPagado, 0),
        t2: 'Por Cobrar',
        v2: pagosRaw.filter(p => ['PENDIENTE', 'VENCIDO', 'CRITICO'].includes(p.estado)).reduce((s, p) => s + (p.monto - (p.montoPagado || 0)), 0),
        t3: 'Revisión Pendiente',
        v3: vouchersPendientes.length
    } : {
        t1: 'Total Pagado',
        v1: pagosRaw.reduce((s, p) => s + p.montoPagado, 0),
        t2: 'Saldo Pendiente',
        v2: pagosRaw.filter(p => ['PENDIENTE', 'VENCIDO', 'CRITICO'].includes(p.estado)).reduce((s, p) => s + (p.monto - (p.montoPagado || 0)), 0),
        t3: 'Próximo Vencimiento',
        v3: pagosRaw.filter(p => ['PENDIENTE'].includes(p.estado)).sort((a,b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime())[0]?.fechaVencimiento || '—'
    }

    const todayString = new Date().toLocaleDateString('es-MX', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
    })

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700" suppressHydrationWarning>
            {/* Top Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2" suppressHydrationWarning>
                <div className="space-y-1" suppressHydrationWarning>
                    <div className="flex items-center gap-3">
                        <h1 className="text-4xl font-black text-[#072E1F] tracking-tighter">Pagos</h1>
                        <span className="px-3 py-1 bg-[#1D9E75]/10 text-[#1D9E75] rounded-lg text-[10px] font-black uppercase tracking-widest border border-[#1D9E75]/10">
                            {rol}
                        </span>
                    </div>
                    <p className="text-gray-400 font-bold text-sm">
                        Estado de pagos — {month && year ? `${months.find(m => m.v === month)?.l} ${year}` : 
                                          fromMonth && toMonth ? `${months.find(m => m.v === fromMonth)?.l} - ${months.find(m => m.v === toMonth)?.l}` :
                                          'Periodo Actual'}
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    {isAdmin && <PagosExportActions residentesPagos={residentesList} />}
                    <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm">
                        <CalendarIcon size={18} className="text-[#1D9E75]" />
                        <span className="text-xs font-black text-gray-700 uppercase tracking-widest">{todayString}</span>
                    </div>
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
                        <p className={`text-3xl font-black tracking-tighter ${stats.v3 > 0 ? 'text-red-600' : 'text-[#072E1F]'}`} suppressHydrationWarning>
                            {stats.v3 === '—' ? stats.v3 : typeof stats.v3 === 'number' ? stats.v3 : new Date(stats.v3).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                        </p>
                    </div>
                </div>
            </div>

            {isAdmin && (
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                        <PagosDateFilters />
                    </div>
                    <PagosSearchFilters 
                        q={q}
                        resId={resId}
                        isGlobalAdmin={isGlobalAdmin}
                        residencias={residencias}
                    />
                </div>
            )}

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
                                    <th className="text-center px-6 py-6">Total Cargo</th>
                                    <th className="text-center px-6 py-6">Recaudado</th>
                                    <th className="text-center px-6 py-6">Estado</th>
                                    <th className="text-center px-6 py-6">Fécha</th>
                                    <th className="text-right px-10 py-6">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {paginatedList.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-10 py-20 text-center">
                                            <p className="text-gray-400 font-bold italic">No se encontraron residentes con el filtro aplicado.</p>
                                        </td>
                                    </tr>
                                ) : paginatedList.map((entry: any) => {
                                    const pendiente = entry.totalMonto - entry.totalPagado
                                    const isHealthy = pendiente === 0
                                    
                                    // Prioridad de pago a mostrar: 1. Vencido, 2. Pendiente, 3. Pagado (el más reciente de los filtrados)
                                    const relevantPagos = [...entry.pagos].sort((a,b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime())
                                    const pVencido = relevantPagos.find(p => p.estado === 'VENCIDO' || p.estado === 'CRITICO')
                                    const pPendiente = relevantPagos.find(p => p.estado === 'PENDIENTE')
                                    const pPagado = [...relevantPagos].reverse().find(p => p.estado === 'PAGADO')
                                    
                                    const p = pVencido || pPendiente || pPagado || relevantPagos[0]
                                    if (!p) return null

                                    const fechaVencimiento = new Date(p.fechaVencimiento || p.createdAt)
                                    const fechaVencimientoSinHora = new Date(fechaVencimiento)
                                    fechaVencimientoSinHora.setUTCHours(0, 0, 0, 0)
                                    const esPagoFuturo = p.estado === 'PENDIENTE' && fechaVencimientoSinHora > today
                                    const esHoy = fechaVencimientoSinHora.getTime() === today.getTime()
                                    const diffTime = fechaVencimientoSinHora.getTime() - today.getTime()
                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                                    const esPorVencer = (p.estado === 'PENDIENTE' || p.estado === 'VENCIDO') && diffDays >= 0 && diffDays <= 3
                                    
                                    let statusVisual = p.estado
                                    if (esPorVencer) statusVisual = 'POR_VENCER'
                                    else if (isHealthy && p.estado !== 'EN_REVISION') statusVisual = 'PAGADO'
                                    else if (!isHealthy && p.estado === 'PAGADO' && pPendiente) statusVisual = 'PENDIENTE'

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
                                                <StatusBadge status={statusVisual as any} />
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <div className="text-[10px] font-black uppercase tracking-widest">
                                                    {isHealthy ? (
                                                        <span className="text-green-600">
                                                            Pagado el {p.fechaPago ? new Date(p.fechaPago).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' }) : '---'}
                                                        </span>
                                                    ) : esHoy ? (
                                                        <span className="text-[#EF9F27]">Vence hoy ({fechaVencimiento.toLocaleDateString('es-MX', { timeZone: 'UTC', day: 'numeric', month: 'long' })})</span>
                                                    ) : (
                                                        <span className="text-gray-400">
                                                            {esPagoFuturo ? 'Vence el' : 'Vencido el'} {fechaVencimiento.toLocaleDateString('es-MX', { timeZone: 'UTC', day: 'numeric', month: 'long' })}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {pendiente > 0 && (
                                                        <RecordarButton residenteId={entry.residente.id} />
                                                    )}
                                                    <Link
                                                        href={`/modules/pagos/residente/${entry.residente.id}`}
                                                        className="px-6 py-2 bg-[#1D9E75]/5 text-[#1D9E75] rounded-xl text-[10px] font-black uppercase tracking-widest border border-[#1D9E75]/10 hover:bg-[#1D9E75] hover:text-white transition-all whitespace-nowrap"
                                                    >
                                                        Ver Pagos
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                    <GeneralPagination totalItems={totalItems} currentPage={page} itemsPerPage={limit} label="Residentes" />
                </div>
            )}

            {/* Bottom Grid: Review Section (Admin Only) */}
            {isAdmin && (
                <div className="grid grid-cols-1 gap-8">
                    <RevisionVouchers vouchers={vouchersPendientes} />
                </div>
            )}

            {/* Resident View (Alternative) */}
            {!isAdmin && (() => {
                const sortedUnpaid = pagosRaw
                    .filter(p => ['PENDIENTE', 'VENCIDO', 'CRITICO', 'EN_REVISION', 'RECHAZADO'].includes(p.estado))
                    .sort((a,b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime())

                const pendingConceptsSeen = new Set<string>()
                const visiblePagos = sortedUnpaid.filter(p => {
                    // Siempre mostrar vencidos, críticos, en revisión o rechazados
                    if (['VENCIDO', 'CRITICO', 'EN_REVISION', 'RECHAZADO'].includes(p.estado)) return true
                    
                    if (p.estado === 'PENDIENTE') {
                        // Agrupar por concepto base (ej: "Garantía", "Mensualidad") para mostrar al menos uno de cada tipo
                        const conceptType = p.concepto.split(' ')[0]
                        if (!pendingConceptsSeen.has(conceptType)) {
                            pendingConceptsSeen.add(conceptType)
                            return true
                        }
                        return false
                    }
                    return false
                })

                return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {visiblePagos.map(pago => (
                            <ResidentPagoCard key={pago.id} pago={pago} />
                        ))}
                        {/* Sección de Historial Detallado */}
                        {(pagosRaw.some(p => p.estado === 'PAGADO')) && (
                            <div className="col-span-full pt-12">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-4">
                                    <span className="h-px bg-gray-100 flex-1"></span>
                                    Historial de Pagos Realizados
                                    <span className="h-px bg-gray-100 flex-1"></span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {pagosRaw.filter(p => p.estado === 'PAGADO').sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
                                    .map((item, idx) => (
                                        <div key={`${item.id}-${idx}`} className="bg-white/50 border border-gray-100 rounded-3xl p-6 flex items-center justify-between group hover:bg-white transition-all shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
                                                    <CheckCircle size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
                                                        {item.concepto}
                                                    </p>
                                                    <p className="text-lg font-black text-gray-900 leading-none">
                                                        S/ {item.monto.toLocaleString('es-MX')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-bold text-gray-400 uppercase">Completado</p>
                                                <p className="text-[10px] font-black text-gray-600">
                                                    {item.fechaPago ? new Date(item.fechaPago).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) : new Date(item.updatedAt || item.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )
            })()}
        </div>
    )
}
