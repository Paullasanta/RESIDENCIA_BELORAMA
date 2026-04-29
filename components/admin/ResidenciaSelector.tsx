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
        <select 
            onChange={(e) => handleChange(e.target.value)}
            defaultValue={currentId || ''}
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold shadow-sm focus:ring-2 focus:ring-[#1D9E75] outline-none"
        >
            <option value="">Todas las Sedes</option>
            {residencias.map(r => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
            ))}
        </select>
    )
}
