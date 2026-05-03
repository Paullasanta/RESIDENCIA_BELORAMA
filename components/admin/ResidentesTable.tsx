'use client'

import { useState } from 'react'
import { Search, Users, Edit2, FileText } from 'lucide-react'
import Link from 'next/link'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { DeleteResidenteButton } from '@/components/shared/DeleteResidenteButton'
import { ReactivateResidenteButton } from '@/components/shared/ReactivateResidenteButton'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { ExportExcelButton } from '@/components/shared/ExportExcelButton'
import { HardDeleteResidenteButton } from '@/components/shared/HardDeleteResidenteButton'

interface ResidentesTableProps {
    residentes: any[]
    isInactiveView?: boolean
}

export function ResidentesTable({ residentes, isInactiveView = false }: ResidentesTableProps) {
    const [search, setSearch] = useState('')

    const filteredResidentes = residentes.filter((r) => {
        const query = search.toLowerCase()
        return (
            r.user.nombre.toLowerCase().includes(query) ||
            (r.user.apellidoPaterno?.toLowerCase().includes(query)) ||
            (r.user.apellidoMaterno?.toLowerCase().includes(query)) ||
            r.user.email.toLowerCase().includes(query) ||
            r.habitacion?.numero?.toLowerCase().includes(query) ||
            r.habitacion?.residencia?.nombre?.toLowerCase().includes(query)
        )
    })

    const handleExportPDF = () => {
        const doc = new jsPDF()
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
        doc.text('BELORAMA', 14, 20)
        
        doc.setFontSize(16)
        doc.setTextColor(7, 46, 31)
        doc.text('Reporte de Residentes', 14, 30)
        
        doc.setFontSize(10)
        doc.setTextColor(150, 150, 150)
        doc.text(`Generado el: ${dateString}`, 14, 38)

        const tableRows = filteredResidentes.map((r) => {
            const fI = new Date(r.fechaIngreso); fI.setUTCHours(12, 0, 0, 0);
            const pagosPeriodo = r.pagos.filter(p => {
                const fV = new Date(p.fechaVencimiento || p.createdAt); fV.setUTCHours(12, 0, 0, 0);
                return fV >= fI;
            });
            const pPendiente = [...pagosPeriodo].filter(p => p.estado !== 'PAGADO' && p.estado !== 'RECHAZADO').sort((a, b) => new Date(a.fechaVencimiento!).getTime() - new Date(b.fechaVencimiento!).getTime())[0];
            const pShow = pPendiente || [...pagosPeriodo].sort((a, b) => new Date(b.fechaVencimiento!).getTime() - new Date(a.fechaVencimiento!).getTime())[0];

            return [
                `${r.user.nombre} ${r.user.apellidoPaterno || ''} ${r.user.apellidoMaterno || ''}`,
                r.user.email,
                r.habitacion ? `Hab. ${r.habitacion.numero} (Piso ${r.habitacion.piso})` : 'Sin asignar',
                r.habitacion?.residencia?.nombre || '—',
                pShow ? `$${pShow.monto.toLocaleString('es-MX')}` : '—',
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
                fontSize: 9,
                cellPadding: 4
            },
            margin: { top: 45 }
        })

        window.open(doc.output('bloburl'), '_blank')
    }

    const residentesExcelData = filteredResidentes.map((r) => {
        const fI = new Date(r.fechaIngreso); fI.setUTCHours(12, 0, 0, 0);
        const pagosPeriodo = r.pagos.filter(p => {
            const fV = new Date(p.fechaVencimiento || p.createdAt); fV.setUTCHours(12, 0, 0, 0);
            return fV >= fI;
        });
        const pPendiente = [...pagosPeriodo].filter(p => p.estado !== 'PAGADO' && p.estado !== 'RECHAZADO').sort((a, b) => new Date(a.fechaVencimiento!).getTime() - new Date(b.fechaVencimiento!).getTime())[0];
        const pShow = pPendiente || [...pagosPeriodo].sort((a, b) => new Date(b.fechaVencimiento!).getTime() - new Date(a.fechaVencimiento!).getTime())[0];

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
            'Pago Actual': pShow?.monto || 0,
            'Estado Actual': pShow?.estado || '—',
            'Fecha Ingreso': new Date(r.fechaIngreso).toLocaleDateString('es-MX'),
            'Fecha Fin': r.fechaFinal ? new Date(r.fechaFinal).toLocaleDateString('es-MX') : '—',
            'Estado': r.activo ? 'ACTIVO' : 'INACTIVO'
        }
    })

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

                <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
                    <button 
                        onClick={handleExportPDF}
                        disabled={filteredResidentes.length === 0}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-100 rounded-xl text-[10px] font-black text-gray-400 hover:text-[#1D9E75] hover:border-[#1D9E75] transition-all shadow-sm disabled:opacity-50 group whitespace-nowrap"
                    >
                        <FileText size={14} />
                        PDF
                    </button>
                    
                    <ExportExcelButton 
                        data={residentesExcelData}
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
                        description={search ? `Refina tu búsqueda o intenta con otros términos para "${search}"` : "Los residentes aparecerán aquí una vez que se den de alta en el sistema."}
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
                                            <th className="hidden xl:table-cell text-left px-2 md:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Garantía</th>
                                            <th className="text-left px-2 md:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Pago</th>
                                            <th className="text-left px-2 md:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Estado</th>
                                        </>
                                    )}
                                    <th className="hidden sm:table-cell text-left px-2 md:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{isInactiveView ? 'Ingreso' : 'Fecha Inicio'}</th>
                                    {!isInactiveView && <th className="hidden lg:table-cell text-left px-2 md:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Fecha Fin</th>}
                                    <th className="text-right px-2 md:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredResidentes.map((r) => (
                                    <tr key={r.id} className="hover:bg-gray-50/50 transition-all group duration-300">
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
                                                    className="hover:underline hover:text-[#1D9E75] transition-all"
                                                >
                                                    <p className="font-black text-[#072E1F] text-sm leading-none mb-1 whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] md:max-w-none">
                                                        {r.user.nombre} {r.user.apellidoPaterno} {r.user.apellidoMaterno}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 font-bold truncate max-w-[120px] md:max-w-none">{r.user.email}</p>
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
                                                    <span className="font-black text-gray-400 text-xs">
                                                        ${r.montoGarantia?.toLocaleString('es-MX') ?? '0'}
                                                    </span>
                                                </td>
                                                <td className="px-2 md:px-6 py-4">
                                                    <span className="font-black text-[#072E1F] text-xs">
                                                        ${r.montoMensual?.toLocaleString('es-MX') ?? '0'}
                                                    </span>
                                                </td>
                                            </>
                                        )}
                                        {!isInactiveView && (
                                            <td className="px-2 md:px-6 py-4">
                                                {(() => {
                                                    // Filtrar pagos del periodo actual (desde el inicio del mes de ingreso)
                                                    const fI = new Date(r.fechaIngreso)
                                                    fI.setUTCDate(1)
                                                    fI.setUTCHours(0, 0, 0, 0)
                                                    
                                                    const pagosPeriodo = r.pagos.filter(p => {
                                                        const fV = new Date(p.fechaVencimiento || p.createdAt)
                                                        fV.setUTCHours(12, 0, 0, 0)
                                                        return fV >= fI
                                                    })

                                                    if (pagosPeriodo.length === 0) return <span className="text-gray-200">—</span>

                                                    // Prioridad: 1. Vencidos/Pendientes más antiguos, 2. Pagado más reciente
                                                    const pagoPendiente = [...pagosPeriodo]
                                                        .filter(p => p.estado !== 'PAGADO' && p.estado !== 'RECHAZADO')
                                                        .sort((a, b) => new Date(a.fechaVencimiento!).getTime() - new Date(b.fechaVencimiento!).getTime())[0]
                                                    
                                                    const pago = pagoPendiente || [...pagosPeriodo].sort((a, b) => new Date(b.fechaVencimiento!).getTime() - new Date(a.fechaVencimiento!).getTime())[0]

                                                    if (!pago) return <span className="text-gray-200">—</span>

                                                    let statusVisual = pago.estado
                                                    if ((pago.estado === 'PENDIENTE' || pago.estado === 'VENCIDO') && pago.fechaVencimiento) {
                                                        const today = new Date()
                                                        today.setUTCHours(0, 0, 0, 0)
                                                        const fechaVenc = new Date(pago.fechaVencimiento)
                                                        fechaVenc.setUTCHours(0, 0, 0, 0)
                                                        const diffDays = Math.ceil((fechaVenc.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                                                        if (diffDays >= 0 && diffDays <= 3) statusVisual = 'POR_VENCER'
                                                    }
                                                    return <StatusBadge status={statusVisual as any} />
                                                })()}
                                            </td>
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
                                                        {isInactiveView && (
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
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
