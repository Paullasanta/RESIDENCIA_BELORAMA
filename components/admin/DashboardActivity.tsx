'use client'

import { useState } from 'react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface DashboardActivityProps {
    pagos: any[]
    today: Date
}

export function DashboardActivity({ pagos, today }: DashboardActivityProps) {
    const [currentPage, setCurrentPage] = useState(0)
    const itemsPerPage = 5
    const totalPages = Math.ceil(pagos.length / itemsPerPage)

    const currentItems = pagos.slice(
        currentPage * itemsPerPage,
        (currentPage + 1) * itemsPerPage
    )

    const todayObj = new Date(today)

    return (
        <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden flex flex-col h-full">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                <h2 className="text-xl font-black text-[#072E1F]">Actividad Reciente</h2>
                <Link href="/modules/pagos" className="text-sm font-black text-[#1D9E75] hover:underline">Ver todo</Link>
            </div>
            
            <div className="flex-grow">
                {pagos.length === 0 ? (
                    <div className="py-20 text-center text-gray-400 font-medium">No hay actividad reciente.</div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {currentItems.map((pago: any) => {
                            const fVenc = new Date(pago.fechaVencimiento)
                            fVenc.setUTCHours(0,0,0,0)
                            const dDiff = Math.ceil((fVenc.getTime() - todayObj.getTime()) / (1000 * 60 * 60 * 24))
                            const isPorVencer = (pago.estado === 'PENDIENTE' || pago.estado === 'VENCIDO') && dDiff >= 0 && dDiff <= 3
                            const statusVis = isPorVencer ? 'POR_VENCER' : pago.estado

                            return (
                                <div key={pago.id} className="flex items-center justify-between px-8 py-5 hover:bg-gray-50/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-[#072E1F]">
                                            {pago.residente.user.nombre.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">
                                                {pago.residente.user.nombre} 
                                                <span className="text-[9px] font-normal text-gray-400 ml-1">({pago.concepto})</span>
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                {new Date(pago.fechaVencimiento).toLocaleDateString('es-MX', { timeZone: 'UTC' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-gray-900">S/ {pago.monto.toLocaleString()}</p>
                                        <StatusBadge status={statusVis as any} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="px-8 py-4 bg-gray-50/30 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Página {currentPage + 1} de {totalPages}
                    </span>
                    <div className="flex gap-2">
                        <button
                            disabled={currentPage === 0}
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="p-2 rounded-xl bg-white border border-gray-100 text-gray-400 disabled:opacity-30 hover:text-[#1D9E75] transition-all"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            disabled={currentPage === totalPages - 1}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="p-2 rounded-xl bg-white border border-gray-100 text-gray-400 disabled:opacity-30 hover:text-[#1D9E75] transition-all"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
