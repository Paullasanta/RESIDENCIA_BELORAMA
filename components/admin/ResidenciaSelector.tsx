'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function ResidenciaSelector({ residencias, currentId }: { residencias: { id: number, nombre: string }[], currentId: number | null }) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const handleChange = (val: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (val) {
            params.set('residenciaId', val)
        } else {
            params.delete('residenciaId')
        }
        router.push(`?${params.toString()}`)
    }

    return (
        <div className="relative group min-w-[180px]">
            <select 
                onChange={(e) => handleChange(e.target.value)}
                defaultValue={currentId || ''}
                className="w-full bg-white border border-gray-100 rounded-2xl h-12 pl-5 pr-10 text-[11px] font-black uppercase tracking-widest shadow-xl shadow-gray-200/50 focus:ring-2 focus:ring-[#1D9E75]/20 outline-none appearance-none transition-all cursor-pointer"
            >
                <option value="">Todas las Sedes</option>
                {residencias.map(r => (
                    <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-[#1D9E75] transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        </div>
    )
}
