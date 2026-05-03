'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface DashboardCriticalDebtsProps {
    pagos: any[]
}

export function DashboardCriticalDebts({ pagos }: DashboardCriticalDebtsProps) {
    const [currentPage, setCurrentPage] = useState(0)
    const itemsPerPage = 5
    const totalPages = Math.ceil(pagos.length / itemsPerPage)

    const currentItems = pagos.slice(
        currentPage * itemsPerPage,
        (currentPage + 1) * itemsPerPage
    )

    return (
        <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-red-100 overflow-hidden flex flex-col h-full">
            <div className="px-8 py-6 border-b border-red-50 flex items-center justify-between bg-red-50/30">
                <h2 className="text-xl font-black text-red-700">Deudas Críticas</h2>
                <span className="bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase">
                    {pagos.length} Alertas
                </span>
            </div>

            <div className="flex-grow">
                {pagos.length === 0 ? (
                    <div className="py-20 text-center text-gray-400 font-medium">Todo bajo control. No hay deudas críticas.</div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {currentItems.map((pago: any) => (
                            <div key={pago.id} className="flex items-center justify-between px-8 py-5 hover:bg-red-50/20 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold">
                                        <AlertCircle size={18} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">{pago.residente.user.nombre}</p>
                                        <p className="text-[10px] text-red-500 font-black uppercase">{pago.concepto}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-red-600">S/ {pago.monto.toLocaleString()}</p>
                                    <Link href={`/modules/pagos/residente/${pago.residente.id}`} className="text-[10px] font-black text-red-700 hover:underline">GESTIONAR</Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="px-8 py-4 bg-red-50/10 border-t border-red-50 flex items-center justify-between">
                    <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">
                        Página {currentPage + 1} de {totalPages}
                    </span>
                    <div className="flex gap-2">
                        <button
                            disabled={currentPage === 0}
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="p-2 rounded-xl bg-white border border-red-50 text-red-400 disabled:opacity-30 hover:bg-red-50 transition-all"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            disabled={currentPage === totalPages - 1}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="p-2 rounded-xl bg-white border border-red-50 text-red-400 disabled:opacity-30 hover:bg-red-50 transition-all"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
