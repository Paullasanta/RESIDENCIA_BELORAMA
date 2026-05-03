'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, Search } from 'lucide-react'

interface PagosSearchFiltersProps {
    q?: string
    resId?: string
    isGlobalAdmin: boolean
    residencias: { id: number, nombre: string }[]
}

export function PagosSearchFilters({ q, resId, isGlobalAdmin, residencias }: PagosSearchFiltersProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const updateParams = (newParams: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString())
        Object.entries(newParams).forEach(([key, value]) => {
            if (value === null) params.delete(key)
            else params.set(key, value)
        })
        router.push(`?${params.toString()}`)
    }

    return (
        <div className="flex items-center gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-3xl border border-gray-100 shadow-sm flex-1">
            <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                    type="text"
                    placeholder="Buscar residente..."
                    defaultValue={q}
                    onKeyDown={(e: any) => {
                        if (e.key === 'Enter') {
                            updateParams({ q: e.target.value || null, page: '1' })
                        }
                    }}
                    className="w-full bg-white border border-gray-100 rounded-2xl pl-10 pr-4 py-2.5 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 transition-all"
                />
            </div>
            {isGlobalAdmin && (
                <select 
                    value={resId || ""}
                    onChange={(e) => updateParams({ resId: e.target.value || null, page: '1' })}
                    className="bg-white border border-gray-100 rounded-2xl px-4 py-2.5 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20"
                >
                    <option value="">Todas las Residencias</option>
                    {residencias.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
            )}
        </div>
    )
}
