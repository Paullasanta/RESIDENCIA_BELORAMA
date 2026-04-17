'use client'

import { useState } from 'react'
import { Search, Users, Edit2, Download } from 'lucide-react'
import Link from 'next/link'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { DeleteResidenteButton } from '@/components/shared/DeleteResidenteButton'

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
                        onClick={() => alert('Próximamente: Exportación a Excel/PDF')}
                        className="flex items-center gap-2 px-6 py-4 bg-white border border-gray-100 rounded-2xl text-xs font-black text-gray-400 hover:text-[#1D9E75] hover:border-[#1D9E75] transition-all shadow-sm"
                    >
                        <Download size={16} />
                        EXPORTAR
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
                                                <div>
                                                    <p className="font-black text-[#072E1F] text-base leading-none mb-1.5">{r.user.nombre}</p>
                                                    <p className="text-xs text-gray-400 font-bold tracking-tight">{r.user.email}</p>
                                                </div>
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
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                                                <Link
                                                    href={`/modules/residentes/${r.id}/editar`}
                                                    className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-[#1D9E75] hover:bg-green-50 rounded-xl transition-all border border-transparent hover:border-green-100 shadow-sm hover:shadow-green-100/20"
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
