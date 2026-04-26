'use client'

import { useState } from 'react'
import { Search, Users, Edit2, Download, FileText } from 'lucide-react'
import Link from 'next/link'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { DeleteResidenteButton } from '@/components/shared/DeleteResidenteButton'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ResidentesTableProps {
    residentes: any[]
}

export function ResidentesTable({ residentes }: ResidentesTableProps) {
    const [search, setSearch] = useState('')

    const filteredResidentes = residentes.filter((r) => {
        const query = search.toLowerCase()
        return (
            r.user.nombre.toLowerCase().includes(query) ||
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

        // Header
        doc.setFontSize(22)
        doc.setTextColor(29, 158, 117) // #1D9E75
        doc.text('BELORAMA', 14, 20)
        
        doc.setFontSize(16)
        doc.setTextColor(7, 46, 31) // #072E1F
        doc.text('Reporte de Residentes', 14, 30)
        
        doc.setFontSize(10)
        doc.setTextColor(150, 150, 150)
        doc.text(`Generado el: ${dateString}`, 14, 38)

        // Table Data Preparation
        const tableRows = filteredResidentes.map((r) => [
            r.user.nombre,
            r.user.email,
            r.habitacion ? `Hab. ${r.habitacion.numero} (Piso ${r.habitacion.piso})` : 'Sin asignar',
            r.habitacion?.residencia?.nombre || '—',
            r.pagos[0] ? `$${r.pagos[0].monto.toLocaleString('es-MX')}` : '—',
            r.pagos[0]?.estado || '—',
            new Date(r.fechaIngreso).toLocaleDateString('es-MX')
        ])

        autoTable(doc, {
            startY: 45,
            head: [['Nombre', 'Email', 'Habitación', 'Residencia', 'Último Pago', 'Estado', 'Ingreso']],
            body: tableRows,
            headStyles: { 
                fillColor: [29, 158, 117], // #1D9E75
                textColor: [255, 255, 255],
                fontSize: 10,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [248, 250, 248] // #F8FAF8
            },
            styles: {
                fontSize: 9,
                cellPadding: 4
            },
            margin: { top: 45 }
        })

        window.open(doc.output('bloburl'), '_blank')
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Buscador Autocompletable */}
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
                    <button 
                        onClick={() => alert('Excel próximamente')}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-100 rounded-xl text-[10px] font-black text-gray-400 hover:text-[#1D9E75] hover:border-[#1D9E75] transition-all shadow-sm whitespace-nowrap"
                    >
                        <Download size={14} />
                        EXCEL
                    </button>
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
                                    <th className="text-left px-4 md:px-10 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Residente</th>
                                    <th className="text-left px-4 md:px-10 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Hab.</th>
                                    <th className="hidden lg:table-cell text-left px-4 md:px-10 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Residencia</th>
                                    <th className="text-left px-4 md:px-10 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Pago</th>
                                    <th className="text-left px-4 md:px-10 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Estado</th>
                                    <th className="hidden sm:table-cell text-left px-4 md:px-10 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Ingreso</th>
                                    <th className="text-right px-4 md:px-10 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredResidentes.map((r) => (
                                    <tr key={r.id} className="hover:bg-gray-50/50 transition-all group duration-300">
                                        <td className="px-4 md:px-10 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="hidden sm:flex w-10 h-10 rounded-xl bg-[#1D9E75]/5 items-center justify-center text-[#1D9E75] font-black text-xs border border-[#1D9E75]/10">
                                                    {r.user.nombre.charAt(0).toUpperCase()}
                                                </div>
                                                <Link 
                                                    href={`/modules/residentes/${r.id}/editar`}
                                                    className="hover:underline hover:text-[#1D9E75] transition-all"
                                                >
                                                    <p className="font-black text-[#072E1F] text-sm leading-none mb-1 whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] md:max-w-none">{r.user.nombre}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold truncate max-w-[120px] md:max-w-none">{r.user.email}</p>
                                                </Link>
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-10 py-4">
                                            <span className="font-black text-gray-700 text-xs">#{r.habitacion?.numero ?? '—'}</span>
                                        </td>
                                        <td className="hidden lg:table-cell px-4 md:px-10 py-4 text-xs font-bold text-gray-400 uppercase">
                                            {r.habitacion?.residencia?.nombre ?? "—"}
                                        </td>
                                        <td className="px-4 md:px-10 py-4">
                                            <span className="font-black text-[#072E1F] text-xs">
                                                {r.pagos[0] ? `$${r.pagos[0].monto.toLocaleString('es-MX')}` : '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 md:px-10 py-4">
                                            {r.pagos[0] ? (
                                                <StatusBadge status={r.pagos[0].estado as any} />
                                            ) : (
                                                <span className="text-gray-200">—</span>
                                            )}
                                        </td>
                                        <td className="hidden sm:table-cell px-4 md:px-10 py-4 text-[10px] font-bold text-gray-400 uppercase">
                                            {new Date(r.fechaIngreso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                                        </td>
                                        <td className="px-4 md:px-10 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/modules/residentes/${r.id}/editar`}
                                                    className="w-8 h-8 flex items-center justify-center text-[#1D9E75] bg-green-50/50 rounded-lg border border-[#1D9E75]/10"
                                                >
                                                    <Edit2 size={14} />
                                                </Link>
                                                <DeleteResidenteButton id={r.id} nombre={r.user.nombre} />
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
