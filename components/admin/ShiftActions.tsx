'use client'

import { useState } from 'react'
import { asignarTurnoLavanderia, liberarTurnoLavanderia } from '@/app/actions/lavanderia'
import { Loader2, UserPlus, UserMinus } from 'lucide-react'

export function ShiftActions({ turno, residentes, canManage }: { turno: any, residentes: any[], canManage: boolean }) {
    if (!canManage) return null;
    const [loading, setLoading] = useState(false)
    const [showAssign, setShowAssign] = useState(false)

    const handleLiberar = async () => {
        setLoading(true)
        await liberarTurnoLavanderia(turno.id)
        setLoading(false)
    }

    const handleAsignar = async (residenteId: number) => {
        setLoading(true)
        await asignarTurnoLavanderia(turno.id, residenteId)
        setLoading(false)
        setShowAssign(false)
    }

    if (turno.estado === 'OCUPADO') {
        return (
            <button
                onClick={handleLiberar}
                disabled={loading}
                className="mt-2 w-full flex items-center justify-center gap-1 py-1 rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors text-[10px] font-bold"
            >
                {loading ? <Loader2 size={10} className="animate-spin" /> : <UserMinus size={10} />}
                Liberar
            </button>
        )
    }

    return (
        <div className="relative">
            <button
                onClick={() => setShowAssign(!showAssign)}
                disabled={loading}
                className="mt-2 w-full flex items-center justify-center gap-1 py-1 rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition-colors text-[10px] font-bold"
            >
                <UserPlus size={10} />
                Asignar
            </button>

            {showAssign && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-2 max-h-32 overflow-y-auto">
                    {residentes.map(r => (
                        <button
                            key={r.id}
                            onClick={() => handleAsignar(r.id)}
                            className="w-full text-left p-1.5 hover:bg-gray-50 rounded text-[10px] truncate border-b border-gray-50 last:border-0"
                        >
                            {r.user.nombre}
                        </button>
                    ))}
                    {residentes.length === 0 && <p className="text-[10px] text-gray-400 italic">No hay residentes</p>}
                </div>
            )}
        </div>
    )
}
