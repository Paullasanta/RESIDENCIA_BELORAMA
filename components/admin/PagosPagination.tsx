'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function PagosPagination({ totalItems, currentPage, itemsPerPage }: { totalItems: number, currentPage: number, itemsPerPage: number }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    if (totalPages <= 1) return null

    const updatePage = (page: number) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('page', page.toString())
        router.push(`?${params.toString()}`)
    }

    const updateLimit = (limit: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('limit', limit)
        params.set('page', '1')
        router.push(`?${params.toString()}`)
    }

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 px-8 py-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mostrar</span>
                <select 
                    value={itemsPerPage}
                    onChange={(e) => updateLimit(e.target.value)}
                    className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-700 focus:outline-none"
                >
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                </select>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Residentes</span>
            </div>

            <div className="flex items-center gap-2">
                <button 
                    disabled={currentPage === 1}
                    onClick={() => updatePage(currentPage - 1)}
                    className="p-2 rounded-xl border border-gray-100 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                >
                    <ChevronLeft size={20} />
                </button>
                
                <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                            key={page}
                            onClick={() => updatePage(page)}
                            className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${currentPage === page ? 'bg-[#072E1F] text-white shadow-lg shadow-gray-200' : 'text-gray-400 hover:bg-gray-50'}`}
                        >
                            {page}
                        </button>
                    ))}
                </div>

                <button 
                    disabled={currentPage === totalPages}
                    onClick={() => updatePage(currentPage + 1)}
                    className="p-2 rounded-xl border border-gray-100 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} - {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems}
            </div>
        </div>
    )
}
