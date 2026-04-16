'use client'

import { useState } from 'react'
import { moderarProducto } from '@/app/actions/marketplace'
import { Check, X, Loader2 } from 'lucide-react'

export function ModeracionButtons({ id }: { id: number }) {
    const [loading, setLoading] = useState<'APROBADO' | 'RECHAZADO' | null>(null)

    const handleModerar = async (estado: 'APROBADO' | 'RECHAZADO') => {
        setLoading(estado)
        const res = await moderarProducto(id, estado)
        if (!res.success) alert(res.error)
        setLoading(null)
    }

    return (
        <div className="flex gap-2">
            <button
                onClick={() => handleModerar('APROBADO')}
                disabled={!!loading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-50 text-green-700 font-bold text-xs border border-green-200 hover:bg-green-100 transition-all active:scale-95 disabled:opacity-50"
            >
                {loading === 'APROBADO' ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Aprobar
            </button>
            <button
                onClick={() => handleModerar('RECHAZADO')}
                disabled={!!loading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-50 text-red-600 font-bold text-xs border border-red-200 hover:bg-red-100 transition-all active:scale-95 disabled:opacity-50"
            >
                {loading === 'RECHAZADO' ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                Rechazar
            </button>
        </div>
    )
}
