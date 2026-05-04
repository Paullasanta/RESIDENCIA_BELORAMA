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
            className="flex items-center justify-center w-10 h-10 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl transition-all active:scale-90 shadow-lg shadow-red-500/5"
            title="Limpiar Turnos"
        >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
        </button>
    )
}
