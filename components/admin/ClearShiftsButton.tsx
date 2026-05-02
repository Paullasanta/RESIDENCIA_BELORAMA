'use client'

import { Trash2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { clearAllShifts } from '@/app/actions/lavanderia'

export function ClearShiftsButton({ lavadoraId, residenciaId, hasAssignments }: { lavadoraId: number, residenciaId: number, hasAssignments: boolean }) {
    const [loading, setLoading] = useState(false)

    const handleClear = async () => {
        if (!hasAssignments) return
        
        // Primera confirmación
        if (!confirm('¿Estás seguro de que deseas liberar TODOS los turnos de esta lavadora?')) return
        
        // Segunda confirmación crítica
        if (!confirm('¡ATENCIÓN! Esta acción borrará todas las reservas de los residentes para esta lavadora. ¿Estás COMPLETAMENTE seguro de proceder?')) return
        
        setLoading(true)
        const res = await clearAllShifts(lavadoraId, residenciaId)
        setLoading(false)
        
        if (!res.success) {
            alert(res.error || 'Error al limpiar turnos')
        }
    }

    if (!hasAssignments) return null

    return (
        <button 
            onClick={handleClear}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-red-500/20"
        >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            Limpiar Turnos
        </button>
    )
}
