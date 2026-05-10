'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, Users, Edit2, FileText, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { DeleteResidenteButton } from '@/components/shared/DeleteResidenteButton'
import { ReactivateResidenteButton } from '@/components/shared/ReactivateResidenteButton'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { ExportExcelButton } from '@/components/shared/ExportExcelButton'
import { HardDeleteResidenteButton } from '@/components/shared/HardDeleteResidenteButton'
import { getResidentesForExport } from '@/app/actions/residentes'

interface ResidentesTableProps {
    residentes: any[]
    residencias: any[]
    isInactiveView?: boolean
    userRole?: string
}

export function ResidentesTable({ residentes, residencias, isInactiveView = false, userRole }: ResidentesTableProps) {
    const isSuperAdmin = userRole === 'SUPER_ADMIN'
    const router = useRouter()
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const [search, setSearch] = useState(searchParams.get('q') || '')
    const [isExporting, setIsExporting] = useState(false)
    const selectedResId = searchParams.get('resId') || ''

    useEffect(() => {
        const currentQ = searchParams.get('q') || ''
        if (search === currentQ) return

        const timeout = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString())
            if (search) {
                params.set('q', search)
            } else {
                params.delete('q')
            }
            params.set('page', '1')
            router.replace(`${pathname}?${params.toString()}`, { scroll: false })
        }, 400)

        return () => clearTimeout(timeout)
    }, [search, pathname, router, searchParams])

    const handleResChange = (id: string) => {
        const params = new URLSearchParams(searchParams)
        if (id) {
            params.set('resId', id)
        } else {
            params.delete('resId')
        }
        params.set('page', '1')
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }

    const filteredResidentes = residentes

    const handleExportPDF = async () => {
        setIsExporting(true)
        try {
            const result = await getResidentesForExport({
                q: search,
                resId: selectedResId,
                inactive: isInactiveView
            })

            if (!result.success || !result.data) {
                alert(result.error || 'Error al obtener datos para el PDF')
                return
            }

            const dataToExport = result.data

            const doc = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4'
            })
            const now = new Date()
            const dateString = now.toLocaleDateString('es-MX', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })

            doc.setFontSize(22)
            doc.setTextColor(29, 158, 117)
            doc.text('GROW RESIDENCIAL', 14, 20)
            
            doc.setFontSize(16)
            doc.setTextColor(7, 46, 31)
            doc.text('Reporte de Residentes', 14, 30)
            
            doc.setFontSize(10)
            doc.setTextColor(150, 150, 150)
            doc.text(`Generado el: ${dateString}`, 14, 38)

            const tableRows = dataToExport.map((r: any) => {
                const fI = new Date(r.fechaIngreso); fI.setUTCHours(12, 0, 0, 0);
                const pagosPeriodo = r.pagos.filter((p: any) => {
                    const fV = new Date(p.fechaVencimiento || p.createdAt); fV.setUTCHours(12, 0, 0, 0);
                    return fV >= fI;
                });
                const pPendiente = [...pagosPeriodo].filter((p: any) => p.estado !== 'PAGADO' && p.estado !== 'RECHAZADO').sort((a: any, b: any) => new Date(a.fechaVencimiento!).getTime() - new Date(b.fechaVencimiento!).getTime())[0];
                const pShow = pPendiente || [...pagosPeriodo].sort((a: any, b: any) => new Date(b.fechaVencimiento!).getTime() - new Date(a.fechaVencimiento!).getTime())[0];

                return [
                    `${r.user.nombre} ${r.user.apellidoPaterno || ''} ${r.user.apellidoMaterno || ''}`,
                    r.user.email,
                    r.habitacion ? `Hab. ${r.habitacion.numero} (Piso ${r.habitacion.piso})` : 'Sin asignar',
                    r.habitacion?.residencia?.nombre || '—',
                    pShow ? `S/ ${pShow.monto.toLocaleString('es-MX')}` : '—',
                    pShow?.estado || '—',
                    new Date(r.fechaIngreso).toLocaleDateString('es-MX'),
                    r.fechaFinal ? new Date(r.fechaFinal).toLocaleDateString('es-MX') : '—'
                ]
            })

            autoTable(doc, {
                startY: 45,
                head: [['Nombre', 'Email', 'Habitación', 'Residencia', 'Pago', 'Estado', 'Fecha Inicio', 'Fecha Fin']],
                body: tableRows,
                headStyles: { 
                    fillColor: [29, 158, 117],
                    textColor: [255, 255, 255],
                    fontSize: 10,
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 248]
                },
                styles: {
                    fontSize: 8,
                    cellPadding: 3
                },
                margin: { top: 45 }
            })

            window.open(doc.output('bloburl'), '_blank')
        } catch (error) {
            console.error('Error exporting PDF:', error)
            alert('Error al generar el PDF')
        } finally {
            setIsExporting(false)
        }
    }

    const prepareExcelData = async () => {
        const result = await getResidentesForExport({
            q: search,
            resId: selectedResId,
            inactive: isInactiveView
        })

        if (!result.success || !result.data) {
            alert(result.error || 'Error al obtener datos para Excel')
            return []
        }

        return result.data.map((r: any) => {
            const fI = new Date(r.fechaIngreso); fI.setUTCHours(12, 0, 0, 0);
            const pagosPeriodo = r.pagos.filter((p: any) => {
                const fV = new Date(p.fechaVencimiento || p.createdAt); fV.setUTCHours(12, 0, 0, 0);
                return fV >= fI;
            });
            const pPendiente = [...pagosPeriodo].filter((p: any) => p.estado !== 'PAGADO' && p.estado !== 'RECHAZADO').sort((a: any, b: any) => new Date(a.fechaVencimiento!).getTime() - new Date(b.fechaVencimiento!).getTime())[0];
            const pShow = pPendiente || [...pagosPeriodo].sort((a: any, b: any) => new Date(b.fechaVencimiento!).getTime() - new Date(a.fechaVencimiento!).getTime())[0];

            return {
                'Nombre Completo': `${r.user.nombre} ${r.user.apellidoPaterno || ''} ${r.user.apellidoMaterno || ''}`,
                'Email': r.user.email,
                'Teléfono': r.user.telefono || '—',
                'DNI': r.user.dni || '—',
                'Residencia': r.habitacion?.residencia?.nombre || '—',
                'Habitación': r.habitacion ? `#${r.habitacion.numero}` : '—',
                'Piso': r.habitacion?.piso || '—',
                'Monto Mensual': r.montoMensual || 0,
                'Monto Garantía': r.montoGarantia || 0,
                'Día de Pago': r.diaPago || 1,
                'Pago Actual': pShow ? `S/ ${pShow.monto.toLocaleString('es-MX')}` : '—',
                'Estado Actual': pShow?.estado || '—',
                'Fecha Ingreso': new Date(r.fechaIngreso).toLocaleDateString('es-MX'),
                'Fecha Fin': r.fechaFinal ? new Date(r.fechaFinal).toLocaleDateString('es-MX') : '—',
                'Estado': r.activo ? 'ACTIVO' : 'INACTIVO'
            }
        })
    }

    const residentesColumns = [
        { header: 'Nombre Completo', key: 'Nombre Completo', width: 35 },
        { header: 'Email', key: 'Email', width: 30 },
        { header: 'Teléfono', key: 'Teléfono', width: 15 },
        { header: 'DNI', key: 'DNI', width: 12 },
        { header: 'Residencia', key: 'Residencia', width: 25 },
        { header: 'Habitación', key: 'Habitación', width: 12 },
        { header: 'Piso', key: 'Piso', width: 8 },
        { header: 'Monto Mensual', key: 'Monto Mensual', width: 15 },
        { header: 'Monto Garantía', key: 'Monto Garantía', width: 15 },
        { header: 'Día de Pago', key: 'Día de Pago', width: 12 },
        { header: 'Estado Último Pago', key: 'Estado Último Pago', width: 20 },
        { header: 'Fecha Inicio', key: 'Fecha Inicio', width: 15 },
        { header: 'Estado', key: 'Estado', width: 12 }
    ]

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="relative group w-full lg:max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#1D9E75] transition-colors">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por nombre, email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-6 py-3 bg-white border border-gray-100 rounded-[1.25rem] shadow-sm focus:ring-4 focus:ring-[#1D9E75]/5 focus:border-[#1D9E75] outline-none transition-all placeholder:text-gray-400 font-medium text-sm"
                    />
                </div>

                <div className="w-full lg:w-64">
                    <select
                        value={selectedResId}
                        onChange={(e) => handleResChange(e.target.value)}
                        className="w-full px-5 py-3 bg-white border border-gray-100 rounded-[1.25rem] shadow-sm focus:ring-4 focus:ring-[#1D9E75]/5 focus:border-[#1D9E75] outline-none transition-all font-bold text-xs uppercase tracking-widest text-gray-500 appearance-none cursor-pointer"
                    >
                        <option value="">Todas las residencias</option>
                        {residencias.map((res) => (
                            <option key={res.id} value={res.id}>
                                {res.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
                    <button 
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-100 rounded-xl text-[10px] font-black text-gray-400 hover:text-[#1D9E75] hover:border-[#1D9E75] transition-all shadow-sm disabled:opacity-50 group whitespace-nowrap"
                    >
                        {isExporting ? <Loader2 className="animate-spin" size={14} /> : <FileText size={14} />}
                        PDF
                    </button>
                    
                    <ExportExcelButton 
                        onPrepareData={prepareExcelData}
                        filename="Reporte_Residentes"
                        sheetName="Residentes"
                        columns={residentesColumns}
                    />
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/40 border border-gray-100 overflow-hidden">
                {filteredResidentes.length === 0 ? (
                    <EmptyState
                        icon={<Users size={64} className="text-gray-200 mb-4" />}
                        title={search ? "No se encontraron resultados" : "No hay residentes registrados"}
                        description={search ? `Refina tu búsqueda o intenta con otros términos para "${search}"` : "Los residentes aparecerán aquí una vez que se den de alta en el sistema en Grow Residencial."}
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-50 bg-gray-50/20">
                                    {isInactiveView && (
                                        <th className="text-left px-2 md:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50/30">Eliminado</th>
                                    )}
                                    <th className="text-left px-2 md:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Residente</th>
                                    <th className="text-left px-2 md:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Hab.</th>
                                    <th className="hidden lg:table-cell text-left px-2 md:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Residencia</th>
                                    {!isInactiveView && (
                                        <>
                                            <th className="hidden xl:table-cell text-left px-2 md:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Concepto</th>
                                            <th className="text-left px-2 md:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Monto</th>
                                            <th className="text-left px-2 md:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Estado</th>
                                        </>
                                    )}
                                    <th className="hidden sm:table-cell text-left px-2 md:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{isInactiveView ? 'Ingreso' : 'Fecha Inicio'}</th>
                                    {!isInactiveView && <th className="hidden lg:table-cell text-left px-2 md:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Fecha Fin</th>}
                                    <th className="text-right px-2 md:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {residentes.map((r) => {
                                    // Lógica de Pago Prioritario
                                    const today = new Date()
                                    today.setUTCHours(0,0,0,0)

                                    const pagos = r.pagos || []

                                    // Filtrar solo mensualidades (excluir garantías, usando regex para acentos)
                                    const mensualidades = pagos.filter((p:any) => 
                                        !p.concepto?.match(/GARANTIA|GARANTÍA/i)
                                    )

                                    // 1. Buscar Vencidos/Críticos en mensualidades
                                    let chosenPago = mensualidades.find((p:any) => p.estado === 'VENCIDO' || p.estado === 'CRITICO')
                                    
                                    // 2. Si no, buscar Pendientes/En Revisión/Rechazados
                                    if (!chosenPago) {
                                        chosenPago = mensualidades.find((p:any) => {
                                            if (['PENDIENTE', 'EN_REVISION', 'RECHAZADO'].includes(p.estado)) {
                                                const fV = new Date(p.fechaVencimiento || p.createdAt)
                                                const diff = Math.ceil((fV.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                                                return diff <= 15
                                            }
                                            return false
                                        })
                                    }

                                    // 3. Si no, buscar el Pagado más reciente
                                    if (!chosenPago) {
                                        chosenPago = mensualidades.find((p:any) => p.estado === 'PAGADO')
                                    }

                                    // 4. Fallback al primero disponible
                                    if (!chosenPago && mensualidades.length > 0) chosenPago = mensualidades[0]

                                    const isStayExpired = r.fechaFinal && new Date(r.fechaFinal) < today

                                    return (
                                        <tr 
                                            key={r.id} 
                                            className={`transition-all group duration-300 ${isStayExpired ? 'bg-red-200 hover:bg-red-300/80 border-l-4 border-red-700 shadow-inner' : 'hover:bg-gray-50/50'}`}
                                        >
                                            {isInactiveView && (
                                                <td className="px-2 md:px-6 py-4 bg-red-50/10">
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-red-600 text-xs">
                                                            {r.deletedAt ? new Date(r.deletedAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) : '—'}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 font-bold">
                                                            {r.deletedAt ? new Date(r.deletedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                        </span>
                                                    </div>
                                                </td>
                                            )}
                                            <td className="px-2 md:px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="hidden 2xl:flex w-8 h-8 rounded-xl bg-[#1D9E75]/5 items-center justify-center text-[#1D9E75] font-black text-xs border border-[#1D9E75]/10 shrink-0">
                                                        {r.user.nombre.charAt(0).toUpperCase()}
                                                    </div>
                                                    <Link 
                                                        href={`/modules/residentes/${r.id}/editar`}
                                                        className="hover:underline hover:text-[#1D9E75] transition-all flex items-center gap-2"
                                                    >
                                                        <div>
                                                            <p className="font-black text-[#072E1F] text-sm leading-none mb-1 whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] md:max-w-none">
                                                                {r.user.nombre} {r.user.apellidoPaterno} {r.user.apellidoMaterno}
                                                            </p>
                                                            <p className="text-[10px] text-gray-400 font-bold truncate max-w-[120px] md:max-w-none">{r.user.email}</p>
                                                        </div>
                                                        {(r.montoMensual <= 0 || r.montoGarantia <= 0 || !r.fechaFinal) && !isInactiveView && (
                                                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-50 text-orange-500 animate-pulse" title="Datos incompletos: Faltan definir montos o la fecha de fin de estadía.">
                                                                <AlertCircle size={14} />
                                                            </div>
                                                        )}
                                                    </Link>
                                                </div>
                                            </td>
                                            <td className="px-2 md:px-6 py-4">
                                                <span className="font-black text-gray-700 text-xs">#{r.habitacion?.numero ?? '—'}</span>
                                            </td>
                                            <td className="hidden lg:table-cell px-2 md:px-6 py-4">
                                                <span className="text-[10px] font-black text-[#1D9E75] uppercase tracking-widest mb-1">
                                                    {r.user?.residencia?.nombre || r.habitacion?.residencia?.nombre || "—"}
                                                </span>
                                            </td>
                                            {!isInactiveView && (
                                                <>
                                                    <td className="hidden xl:table-cell px-2 md:px-6 py-4">
                                                        <span className="font-bold text-gray-400 text-[10px] uppercase tracking-tighter truncate max-w-[100px] block">
                                                            {chosenPago?.concepto || 'MENSUALIDAD'}
                                                        </span>
                                                    </td>
                                                    <td className="px-2 md:px-6 py-4">
                                                        <span className="font-black text-[#072E1F] text-xs">
                                                            S/ {(chosenPago?.monto || r.montoMensual)?.toLocaleString('es-MX') ?? '0'}
                                                        </span>
                                                    </td>
                                                    <td className="px-2 md:px-6 py-4">
                                                        {chosenPago ? (() => {
                                                            let statusVisual = chosenPago.estado
                                                            if ((chosenPago.estado === 'PENDIENTE' || chosenPago.estado === 'VENCIDO') && chosenPago.fechaVencimiento) {
                                                                const fechaVenc = new Date(chosenPago.fechaVencimiento)
                                                                fechaVenc.setUTCHours(0, 0, 0, 0)
                                                                const diffDays = Math.ceil((fechaVenc.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                                                                if (diffDays >= 0 && diffDays <= 3) statusVisual = 'POR_VENCER'
                                                                else if (diffDays > 15 && chosenPago.estado === 'PENDIENTE') statusVisual = 'PROXIMO'
                                                            }
                                                            return <StatusBadge status={statusVisual as any} />
                                                        })() : <StatusBadge status="PENDIENTE" />}
                                                    </td>
                                                </>
                                            )}
                                            <td className="hidden sm:table-cell px-2 md:px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">
                                            {new Date(r.fechaIngreso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                                        </td>
                                        {!isInactiveView && (
                                            <td className="hidden lg:table-cell px-2 md:px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">
                                                {r.fechaFinal ? new Date(r.fechaFinal).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) : '—'}
                                            </td>
                                        )}
                                        <td className="px-2 md:px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {!isInactiveView && (
                                                    <Link
                                                        href={`/modules/residentes/${r.id}/editar`}
                                                        className="w-8 h-8 flex items-center justify-center text-[#1D9E75] bg-green-50/50 rounded-lg border border-[#1D9E75]/10"
                                                    >
                                                        <Edit2 size={14} />
                                                    </Link>
                                                )}
                                                        {isInactiveView && isSuperAdmin && (
                                                            <HardDeleteResidenteButton id={r.id} nombre={r.user.nombre} />
                                                        )}
                                                        {r.activo ? (
                                                            <DeleteResidenteButton id={r.id} nombre={r.user.nombre} />
                                                        ) : (
                                                            <ReactivateResidenteButton 
                                                                id={r.id} 
                                                                nombre={r.user.nombre} 
                                                                defaultMontoMensual={r.montoMensual}
                                                                defaultMontoGarantia={r.montoGarantia}
                                                            />
                                                        )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
