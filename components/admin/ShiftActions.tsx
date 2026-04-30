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

    return (
        <div className="relative">
            <button
                onClick={() => setShowAssign(!showAssign)}
                disabled={loading}
                className={`w-full flex items-center justify-center gap-1 py-1.5 rounded-lg transition-colors text-[10px] font-bold ${
                    turno.estado === 'OCUPADO' 
                        ? 'bg-white/10 text-white hover:bg-white/20' 
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
            >
                {loading ? <Loader2 size={12} className="animate-spin" /> : (
                    turno.estado === 'OCUPADO' ? (
                        <><UserPlus size={12} /> Cambiar</>
                    ) : (
                        <><UserPlus size={12} /> Asignar</>
                    )
                )}
            </button>

            {showAssign && (
                <div className="absolute bottom-full left-0 right-0 z-50 mb-1 bg-white border border-gray-100 rounded-xl shadow-2xl p-1.5 max-h-48 overflow-y-auto">
                    {turno.estado === 'OCUPADO' && (
                        <button
                            onClick={handleLiberar}
                            className="w-full text-left p-2 hover:bg-red-50 text-red-600 rounded-lg text-[10px] font-black truncate border-b border-gray-50 flex items-center gap-2 mb-1 transition-colors"
                        >
                            <UserMinus size={12} /> Liberar (Dejar vacío)
                        </button>
                    )}
                    {residentes.map(r => (
                        <button
                            key={r.id}
                            onClick={() => handleAsignar(r.id)}
                            className={`w-full text-left p-2 hover:bg-gray-50 rounded-lg text-[10px] truncate transition-colors ${turno.residenteId === r.id ? 'bg-[#1D9E75]/10 text-[#1D9E75] font-black' : 'font-medium text-gray-700'}`}
                        >
                            {r.user.nombre}
                        </button>
                    ))}
                    {residentes.length === 0 && <p className="text-[10px] text-gray-400 italic p-2 text-center">No hay residentes</p>}
                </div>
            )}
        </div>
    )
}
