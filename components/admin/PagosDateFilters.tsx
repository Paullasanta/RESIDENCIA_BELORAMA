'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar, Filter, X } from 'lucide-react'
import { useState } from 'react'

export function PagosDateFilters() {
    const router = useRouter()
    const searchParams = useSearchParams()
    
    const [isRangeMode, setIsRangeMode] = useState(searchParams.has('fromMonth'))

    const currentMonth = searchParams.get('month') || (new Date().getUTCMonth() + 1).toString().padStart(2, '0')
    const currentYear = searchParams.get('year') || new Date().getUTCFullYear().toString()
    
    const fromMonth = searchParams.get('fromMonth') || ''
    const fromYear = searchParams.get('fromYear') || currentYear
    const toMonth = searchParams.get('toMonth') || currentMonth
    const toYear = searchParams.get('toYear') || currentYear

    const updateParams = (newParams: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString())
        
        // Validar rango si estamos en modo rango
        if (isRangeMode) {
            const currentFromMonth = newParams.fromMonth || fromMonth
            const currentFromYear = newParams.fromYear || fromYear
            const currentToMonth = newParams.toMonth || toMonth
            const currentToYear = newParams.toYear || toYear

            if (currentFromMonth && currentFromYear && currentToMonth && currentToYear) {
                const start = parseInt(currentFromYear) * 100 + parseInt(currentFromMonth)
                const end = parseInt(currentToYear) * 100 + parseInt(currentToMonth)

                if (end < start) {
                    // Si el final es menor al inicio, igualamos el final al inicio
                    newParams.toMonth = currentFromMonth
                    newParams.toYear = currentFromYear
                }
            }
        }

        Object.entries(newParams).forEach(([key, value]) => {
            if (value === null) params.delete(key)
            else params.set(key, value)
        })
        router.push(`?${params.toString()}`)
    }

    const months = [
        { v: '01', l: 'Enero' }, { v: '02', l: 'Febrero' }, { v: '03', l: 'Marzo' },
        { v: '04', l: 'Abril' }, { v: '05', l: 'Mayo' }, { v: '06', l: 'Junio' },
        { v: '07', l: 'Julio' }, { v: '08', l: 'Agosto' }, { v: '09', l: 'Septiembre' },
        { v: '10', l: 'Octubre' }, { v: '11', l: 'Noviembre' }, { v: '12', l: 'Diciembre' }
    ]

    const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString())

    const handleClear = () => {
        const params = new URLSearchParams(searchParams.toString())
        params.delete('month')
        params.delete('year')
        params.delete('fromMonth')
        params.delete('fromYear')
        params.delete('toMonth')
        params.delete('toYear')
        router.push(`?${params.toString()}`)
    }

    return (
        <div className="flex flex-wrap items-center gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 px-4 py-2 bg-[#1D9E75]/5 rounded-2xl text-[#1D9E75]">
                <Filter size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Filtros de Fecha</span>
            </div>

            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setIsRangeMode(false)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isRangeMode ? 'bg-[#072E1F] text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                >
                    Mes Único
                </button>
                <button 
                    onClick={() => setIsRangeMode(true)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isRangeMode ? 'bg-[#072E1F] text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                >
                    Rango
                </button>
            </div>

            <div className="h-6 w-[1px] bg-gray-100 hidden sm:block"></div>

            {!isRangeMode ? (
                <div className="flex items-center gap-2">
                    <select 
                        value={currentMonth}
                        onChange={(e) => updateParams({ month: e.target.value, year: currentYear, fromMonth: null, fromYear: null, toMonth: null, toYear: null })}
                        className="bg-white border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 transition-all"
                    >
                        {months.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                    </select>
                    <select 
                        value={currentYear}
                        onChange={(e) => updateParams({ year: e.target.value, month: currentMonth, fromMonth: null, fromYear: null, toMonth: null, toYear: null })}
                        className="bg-white border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 transition-all"
                    >
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            ) : (
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                        <span className="text-[9px] font-black text-gray-400 uppercase mr-1">Desde:</span>
                        <select 
                            value={fromMonth}
                            onChange={(e) => updateParams({ 
                                fromMonth: e.target.value, 
                                fromYear: fromYear, 
                                toMonth: toMonth, 
                                toYear: toYear,
                                month: null, year: null 
                            })}
                            className="bg-white border border-gray-100 rounded-xl px-2 py-2 text-xs font-bold text-gray-700"
                        >
                            <option value="">Mes</option>
                            {months.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                        </select>
                        <select 
                            value={fromYear}
                            onChange={(e) => updateParams({ 
                                fromYear: e.target.value, 
                                fromMonth: fromMonth, 
                                toMonth: toMonth, 
                                toYear: toYear,
                                month: null, year: null 
                            })}
                            className="bg-white border border-gray-100 rounded-xl px-2 py-2 text-xs font-bold text-gray-700"
                        >
                            <option value="">Año</option>
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>

                    <div className="w-4 h-[1px] bg-gray-200"></div>

                    <div className="flex items-center gap-1">
                        <span className="text-[9px] font-black text-gray-400 uppercase mr-1">Hasta:</span>
                        <select 
                            value={toMonth}
                            onChange={(e) => updateParams({ 
                                toMonth: e.target.value, 
                                toYear: toYear, 
                                fromMonth: fromMonth, 
                                fromYear: fromYear,
                                month: null, year: null 
                            })}
                            className="bg-white border border-gray-100 rounded-xl px-2 py-2 text-xs font-bold text-gray-700"
                        >
                            <option value="">Mes</option>
                            {months.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                        </select>
                        <select 
                            value={toYear}
                            onChange={(e) => updateParams({ 
                                toYear: e.target.value, 
                                toMonth: toMonth, 
                                fromMonth: fromMonth, 
                                fromYear: fromYear,
                                month: null, year: null 
                            })}
                            className="bg-white border border-gray-100 rounded-xl px-2 py-2 text-xs font-bold text-gray-700"
                        >
                            <option value="">Año</option>
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>
            )}

            {(searchParams.has('month') || searchParams.has('fromMonth')) && (
                <button 
                    onClick={handleClear}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="Limpiar filtros"
                >
                    <X size={16} />
                </button>
            )}
        </div>
    )
}
