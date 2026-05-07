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

function getPagoLogic(entry: any, today: Date) {
    const pendiente = entry.totalMonto - entry.totalPagado
    const isHealthy = pendiente === 0
    
    const relevantPagos = [...entry.pagos].sort((a:any, b:any) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime())
    const pVencido = relevantPagos.find(p => p.estado === 'VENCIDO' || p.estado === 'CRITICO')
    const pPendiente = relevantPagos.find(p => p.estado === 'PENDIENTE')
    const pPagado = [...relevantPagos].reverse().find(p => p.estado === 'PAGADO')
    
    const p = pVencido || pPendiente || pPagado || relevantPagos[0]
    if (!p) return { p: null, statusVisual: null, isHealthy: false, pendiente: 0 }

    const fechaVencimiento = new Date(p.fechaVencimiento || p.createdAt)
    const fechaVencimientoSinHora = new Date(fechaVencimiento)
    fechaVencimientoSinHora.setUTCHours(0, 0, 0, 0)
    const diffTime = fechaVencimientoSinHora.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const esPorVencer = (p.estado === 'PENDIENTE' || p.estado === 'VENCIDO') && diffDays >= 0 && diffDays <= 3
    
    let statusVisual = p.estado
    if (esPorVencer) statusVisual = 'POR_VENCER'
    else if (isHealthy && p.estado !== 'EN_REVISION') statusVisual = 'PAGADO'
    else if (!isHealthy && p.estado === 'PAGADO' && pPendiente) statusVisual = 'PENDIENTE'

    return { p, statusVisual, isHealthy, pendiente }
}

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
    const isAnyAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(rol)
    const isAdmin = isAnyAdmin || permisos?.includes('MANAGE_PAYMENTS')
    const isGlobalAdmin = isAnyAdmin && !residenciaId
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

    if (fromMonth && toMonth) {
        const fYear = fromYear || new Date().getUTCFullYear().toString()
        const tYear = toYear || fYear
        let start = new Date(parseInt(fYear), parseInt(fromMonth) - 1, 1)
        let end = new Date(parseInt(tYear), parseInt(toMonth), 0, 23, 59, 59)
        
        // Validación de seguridad: si el final es antes que el inicio, los igualamos
        if (end < start) end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59)
        
        dateWhere = { fechaVencimiento: { gte: start, lte: end } }
    } else if (isAdmin && filterMonth) {
        const fYear = filterYear || new Date().getUTCFullYear().toString()
        const start = new Date(parseInt(fYear), parseInt(filterMonth) - 1, 1)
        const end = new Date(parseInt(fYear), parseInt(filterMonth), 0, 23, 59, 59)
        dateWhere = { fechaVencimiento: { gte: start, lte: end } }
    }

    // Data fetching
    let residentesList: any[] = []
    let vouchersPendientes: any[] = []
    let pagosRaw: any[] = [] // Para estadísticas globales
    
    if (isAdmin) {
        // Buscamos RESIDENTES primero para que el buscador de nombre (q) sea efectivo
        const residentsWithPagos = await prisma.residente.findMany({
            where: {
                user: {
                    ...(isGlobalAdmin ? {} : { residenciaId: residenciaId || -1 }),
                    ...(q ? {
                        OR: [
                            { nombre: { contains: q, mode: 'insensitive' } },
                            { email: { contains: q, mode: 'insensitive' } }
                        ]
                    } : {})
                },
                ...(resId ? { habitacion: { residenciaId: parseInt(resId) } } : {}),
                // Si hay filtro de fecha y no hay búsqueda por nombre, 
                // solo mostramos residentes que tengan pagos en ese rango
                ...(dateWhere.fechaVencimiento && !q ? {
                    pagos: { some: dateWhere }
                } : {})
            },
            include: {
                user: { select: { nombre: true, email: true } },
                habitacion: { include: { residencia: true } },
                pagos: {
                    where: dateWhere,
                    orderBy: { fechaVencimiento: 'asc' }
                }
            }
        })

        // Transformamos al formato que la tabla espera
        residentesList = residentsWithPagos.map(res => {
            const pagos = res.pagos
            const totalMonto = pagos.filter(p => p.estado !== 'RECHAZADO').reduce((sum, p) => sum + p.monto, 0)
            const totalPagado = pagos.filter(p => p.estado !== 'RECHAZADO').reduce((sum, p) => sum + p.montoPagado, 0)
            
            // Calcular urgencia y minFecha para ordenamiento
            let urgencia = 0
            let minFecha = Infinity

            pagos.forEach(p => {
                const fV = new Date(p.fechaVencimiento || p.createdAt)
                const diff = Math.ceil((fV.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                const isPV = (p.estado === 'PENDIENTE' || p.estado === 'VENCIDO') && diff >= 0 && diff <= 3
                
                let weight = 0
                if (isPV) weight = 100
                else if (p.estado === 'VENCIDO') weight = 90
                else if (p.estado === 'CRITICO') weight = 80
                else if (p.estado === 'PENDIENTE') weight = 50
                
                if (weight > urgencia) urgencia = weight
                if (p.estado !== 'PAGADO' && fV.getTime() < minFecha) minFecha = fV.getTime()
            })

            return {
                residente: res,
                pagos,
                totalMonto,
                totalPagado,
                urgencia,
                minFecha: minFecha === Infinity ? null : minFecha
            }
        })

        // Vouchers pendientes para el badge de revisión
        vouchersPendientes = await prisma.pago.findMany({
            where: {
                estado: 'EN_REVISION',
                ...(isGlobalAdmin ? {} : { residente: { user: { residenciaId: residenciaId || -1 } } })
            },
            include: { residente: { include: { user: true } } }
        })

        // Pagos raw para estadísticas de las cards superiores
        pagosRaw = await prisma.pago.findMany({
            where: {
                ...(isGlobalAdmin ? {} : { residente: { user: { residenciaId: residenciaId || -1 } } }),
                ...dateWhere
            }
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

    // Filtering logic
    if (filter === 'debtors') {
        residentesList = residentesList.filter((r: any) => (r.totalMonto - r.totalPagado) > 0)
    } else if (filter === 'revision') {
        residentesList = residentesList.filter((r: any) => r.pagos.some((p: any) => p.estado === 'EN_REVISION'))
    }

    // Ordenar por fecha (más antigua primero). Residentes sin pagos pendientes van al final.
    residentesList.sort((a: any, b: any) => {
        const dateA = a.minFecha ?? Infinity
        const dateB = b.minFecha ?? Infinity
        return dateA - dateB
    })

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



            {/* Stats Dashboard Compacto */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
                <Link href="/modules/pagos" className="bg-white rounded-3xl p-4 md:p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-6 group hover:-translate-y-1 transition-all">
                    <div className="w-10 h-10 md:w-16 md:h-16 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 border border-green-100">
                        <CheckCircle size={24} className="md:hidden" />
                        <CheckCircle size={32} className="hidden md:block" />
                    </div>
                    <div>
                        <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5 md:mb-1">{stats.t1}</p>
                        <p className="text-lg md:text-3xl font-black text-[#072E1F] tracking-tighter">S/ {stats.v1.toLocaleString('es-MX')}</p>
                    </div>
                </Link>
                <Link href="/modules/pagos?filter=debtors" className={`bg-white rounded-3xl p-4 md:p-8 border shadow-sm flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-6 group hover:-translate-y-1 transition-all ${filter === 'debtors' ? 'border-[#EF9F27] ring-4 ring-orange-50' : 'border-gray-100'}`}>
                    <div className="w-10 h-10 md:w-16 md:h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-[#EF9F27] border border-orange-100">
                        <Clock size={24} className="md:hidden" />
                        <Clock size={32} className="hidden md:block" />
                    </div>
                    <div>
                        <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5 md:mb-1">{stats.t2}</p>
                        <p className="text-lg md:text-3xl font-black text-[#072E1F] tracking-tighter">S/ {stats.v2.toLocaleString('es-MX')}</p>
                    </div>
                </Link>
                <Link href="/modules/pagos?filter=revision#revision-section" className={`bg-white rounded-3xl p-4 md:p-8 border shadow-sm flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-6 col-span-2 md:col-span-1 group hover:-translate-y-1 transition-all ${filter === 'revision' ? 'border-red-500 ring-4 ring-red-50' : 'border-gray-100'}`}>
                    <div className={`w-10 h-10 md:w-16 md:h-16 rounded-2xl flex items-center justify-center border transition-all ${stats.v3 > 0 ? 'bg-red-50 text-red-500 border-red-100 animate-pulse' : 'bg-gray-50 text-gray-300 border-gray-100'}`}>
                        <Bell size={24} className="md:hidden" />
                        <Bell size={32} className="hidden md:block" />
                    </div>
                    <div>
                        <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5 md:mb-1">{stats.t3}</p>
                        <p className={`text-lg md:text-3xl font-black tracking-tighter ${stats.v3 > 0 ? 'text-red-600' : 'text-[#072E1F]'}`} suppressHydrationWarning>
                            {stats.v3 === '—' ? stats.v3 : typeof stats.v3 === 'number' ? stats.v3 : new Date(stats.v3).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                        </p>
                    </div>
                </Link>
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
                          {/* Vista para TABLET/DESKTOP (Tabla tradicional) */}
                    <div className="hidden md:block overflow-x-auto">
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
                                    const { p, statusVisual, isHealthy, pendiente } = getPagoLogic(entry, today)
                                    if (!p) return null
                                    const fechaVencimiento = new Date(p.fechaVencimiento || p.createdAt)

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
                                                    ) : (
                                                        <span className={p.estado === 'PENDIENTE' ? 'text-gray-400' : 'text-red-400'}>
                                                            {p.estado === 'PENDIENTE' ? 'Vence' : 'Venció'} {fechaVencimiento.toLocaleDateString('es-MX', { timeZone: 'UTC', day: 'numeric', month: 'long' })}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {pendiente > 0 && <RecordarButton residenteId={entry.residente.id} />}
                                                    <Link href={`/modules/pagos/residente/${entry.residente.id}`} className="px-6 py-2 bg-[#1D9E75]/5 text-[#1D9E75] rounded-xl text-[10px] font-black uppercase tracking-widest border border-[#1D9E75]/10 hover:bg-[#1D9E75] hover:text-white transition-all">
                                                        Ver
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Vista para MÓVIL (Cards Verticales) */}
                    <div className="md:hidden divide-y divide-gray-100">
                        {paginatedList.length === 0 ? (
                            <div className="p-10 text-center text-gray-400 font-bold italic">No hay resultados</div>
                        ) : paginatedList.map((entry: any) => {
                            const { p, statusVisual, isHealthy, pendiente } = getPagoLogic(entry, today)
                            if (!p) return null
                            const fechaVencimiento = new Date(p.fechaVencimiento || p.createdAt)

                            return (
                                <div key={entry.residente.id} className="p-5 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-black text-[#072E1F] text-sm">{entry.residente.user.nombre}</h4>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                                Residencia {entry.residente.habitacion?.residencia?.nombre || 'S/N'}
                                            </p>
                                        </div>
                                        <StatusBadge status={statusVisual as any} />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                        <div>
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Cargo Total</p>
                                            <p className="font-black text-[#072E1F]">S/ {entry.totalMonto.toLocaleString('es-MX')}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Saldo Pendiente</p>
                                            <p className={`font-black ${pendiente > 0 ? 'text-red-500' : 'text-[#1D9E75]'}`}>S/ {pendiente.toLocaleString('es-MX')}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-3 pt-2">
                                        <div className="text-[9px] font-black uppercase text-gray-400">
                                            {isHealthy ? 'Al día' : `${p.estado === 'PENDIENTE' ? 'Vence' : 'Venció'}: ${fechaVencimiento.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`}
                                        </div>
                                        <div className="flex gap-2">
                                            {pendiente > 0 && <RecordarButton residenteId={entry.residente.id} />}
                                            <Link href={`/modules/pagos/residente/${entry.residente.id}`} className="px-5 py-2 bg-[#1D9E75] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#1D9E75]/20">
                                                Detalles
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <GeneralPagination totalItems={totalItems} currentPage={page} itemsPerPage={limit} label="Residentes" />
                </div>
            )}

            {/* Bottom Grid: Review Section (Admin Only) */}
            {isAdmin && (
                <div id="revision-section" className="grid grid-cols-1 gap-8 scroll-mt-10">
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {pagosRaw.filter(p => p.estado === 'PAGADO')
                                    .sort((a, b) => new Date(b.fechaPago || b.updatedAt || b.createdAt).getTime() - new Date(a.fechaPago || a.updatedAt || a.createdAt).getTime())
                                    .map((item, idx) => (
                                        <div key={`${item.id}-${idx}`} className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-[#1D9E75]/10 flex items-center justify-center text-[#1D9E75] shrink-0 border border-[#1D9E75]/20">
                                                    <CheckCircle size={20} strokeWidth={3} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest truncate">
                                                        {item.concepto}
                                                    </p>
                                                    <p className="text-lg font-black text-[#072E1F] tracking-tighter">
                                                        S/ {item.monto.toLocaleString('es-MX')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                                <div className="px-2 py-0.5 bg-green-50 text-[#1D9E75] rounded-md text-[7px] font-black uppercase tracking-widest border border-green-100">
                                                    Éxito
                                                </div>
                                                <p className="text-[9px] font-bold text-gray-400 flex items-center gap-1">
                                                    <CalendarIcon size={10} className="text-[#1D9E75]" />
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
