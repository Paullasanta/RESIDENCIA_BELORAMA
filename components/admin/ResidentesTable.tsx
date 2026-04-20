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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Buscador Autocompletable */}
                <div className="relative group max-w-lg w-full">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#1D9E75] transition-colors">
                        <Search size={20} />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por nombre, email o habitación..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-[1.5rem] shadow-sm shadow-gray-100/50 focus:ring-4 focus:ring-[#1D9E75]/5 focus:border-[#1D9E75] outline-none transition-all placeholder:text-gray-400 font-medium text-sm"
                    />
                    {search && (
                    <div className="absolute right-5 inset-y-0 flex items-center">
                            <span className="text-[10px] font-black text-[#1D9E75] uppercase tracking-widest bg-green-50 px-3 py-1.5 rounded-full border border-green-100 animate-in fade-in zoom-in duration-300">
                                {filteredResidentes.length} {filteredResidentes.length === 1 ? 'coincidencia' : 'coincidencias'}
                            </span>
                    </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleExportPDF}
                        disabled={filteredResidentes.length === 0}
                        className="flex items-center gap-2 px-6 py-4 bg-white border border-gray-100 rounded-2xl text-xs font-black text-gray-400 hover:text-[#1D9E75] hover:border-[#1D9E75] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        <FileText size={16} className="group-hover:scale-110 transition-transform" />
                        PDF
                    </button>
                    <button 
                        onClick={() => alert('Excel próximamente')}
                        className="flex items-center gap-2 px-6 py-4 bg-white border border-gray-100 rounded-2xl text-xs font-black text-gray-400 hover:text-[#1D9E75] hover:border-[#1D9E75] transition-all shadow-sm"
                    >
                        <Download size={16} />
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
                                    <th className="text-left px-10 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Residente</th>
                                    <th className="text-left px-10 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Habitación</th>
                                    <th className="text-left px-10 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Residencia</th>
                                    <th className="text-left px-10 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Último Pago</th>
                                    <th className="text-left px-10 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Estado</th>
                                    <th className="text-left px-10 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Ingreso</th>
                                    <th className="text-right px-10 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredResidentes.map((r) => (
                                    <tr key={r.id} className="hover:bg-gray-50/50 transition-all group duration-300">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-[1.25rem] bg-[#1D9E75]/5 flex items-center justify-center text-[#1D9E75] font-black text-sm border border-[#1D9E75]/10 shadow-sm group-hover:scale-110 transition-transform">
                                                    {r.user.nombre.charAt(0).toUpperCase()}
                                                </div>
                                                <Link 
                                                    href={`/modules/residentes/${r.id}/editar`}
                                                    className="hover:underline hover:text-[#1D9E75] transition-all"
                                                >
                                                    <p className="font-black text-[#072E1F] text-base leading-none mb-1.5">{r.user.nombre}</p>
                                                    <div className="flex items-center gap-2 text-xs font-bold tracking-tight">
                                                        <span className="text-gray-400">{r.user.email}</span>
                                                        <span className="text-gray-300">•</span>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                e.preventDefault();
                                                                navigator.clipboard.writeText(r.user.dni || '');
                                                                const target = e.currentTarget;
                                                                const originalText = target.innerText;
                                                                target.innerText = '¡Copiado!';
                                                                setTimeout(() => target.innerText = originalText, 2000);
                                                            }}
                                                            className="text-[#1D9E75] bg-[#1D9E75]/5 px-2 py-0.5 rounded-md border border-[#1D9E75]/10 hover:bg-[#1D9E75] hover:text-white transition-all active:scale-95"
                                                            title="Clic para copiar DNI"
                                                        >
                                                            DNI: {r.user.dni ?? '—'}
                                                        </button>
                                                    </div>
                                                </Link>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            {r.habitacion ? (
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-black text-gray-700 text-sm">Hab. {r.habitacion.numero}</span>
                                                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded-md self-start border border-gray-100">Piso {r.habitacion.piso}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-300 italic font-black text-xs uppercase tracking-widest">Sin asignar</span>
                                            )}
                                        </td>
                                        <td className="px-10 py-6">
                                            <span className="font-black text-gray-500 uppercase text-[11px] tracking-widest">{r.habitacion?.residencia?.nombre ?? "—"}</span>
                                        </td>
                                        <td className="px-10 py-6">
                                            <span className="font-black text-[#072E1F] text-base tracking-tighter">
                                                {r.pagos[0] ? `$${r.pagos[0].monto.toLocaleString('es-MX')}` : <span className="text-gray-200">—</span>}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6">
                                            {r.pagos[0] ? (
                                                <StatusBadge status={r.pagos[0].estado as any} />
                                            ) : (
                                                <span className="text-gray-200">—</span>
                                            )}
                                        </td>
                                        <td className="px-10 py-6">
                                            <span className="text-[11px] font-black text-gray-400 uppercase tracking-tighter">
                                                {new Date(r.fechaIngreso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex items-center justify-end gap-3 transition-all duration-300">
                                                <Link
                                                    href={`/modules/residentes/${r.id}/editar`}
                                                    className="w-10 h-10 flex items-center justify-center text-[#1D9E75] bg-green-50/50 hover:bg-[#1D9E75] hover:text-white rounded-[1.25rem] transition-all border border-[#1D9E75]/10 shadow-sm shadow-[#1D9E75]/5"
                                                    title="Editar residente"
                                                >
                                                    <Edit2 size={18} />
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
