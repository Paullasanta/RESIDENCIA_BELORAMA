'use client'

import { useTransition } from 'react'
import { registrarAsistenciaComida } from '@/app/actions/comida'
import { Check, X, Loader2 } from 'lucide-react'

interface AsistenciaButtonsProps {
  residenteId: number
  menuId: number
  asiste: boolean | undefined
}

export function AsistenciaButtons({ residenteId, menuId, asiste }: AsistenciaButtonsProps) {
  const [isPending, startTransition] = useTransition()

  function handleAction(value: boolean) {
    if (isPending) return
    startTransition(async () => {
      await registrarAsistenciaComida(residenteId, menuId, value)
    })
  }

  return (
    <div className="mt-auto p-4 bg-gray-50/50 border-t border-gray-50 flex items-center gap-3">
      <button
        onClick={() => handleAction(true)}
        disabled={isPending}
        className={`flex-1 py-3.5 rounded-2xl font-black text-xs transition-all shadow-sm flex items-center justify-center gap-2 ${
          asiste === true 
            ? 'bg-green-500 text-white shadow-green-200' 
            : 'bg-white border border-gray-100 text-[#1D9E75] hover:bg-green-50'
        } disabled:opacity-50`}
      >
        {isPending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : asiste === true ? (
          <>
            <Check size={14} />
            CONFIRMADO
          </>
        ) : (
          'CONFIRMAR ASISTENCIA'
        )}
      </button>

      <button
        onClick={() => handleAction(false)}
        disabled={isPending}
        className={`w-14 h-12 flex items-center justify-center rounded-2xl font-black transition-all ${
          asiste === false 
            ? 'bg-red-500 text-white shadow-red-200' 
            : 'bg-white border border-gray-100 text-red-500 hover:bg-red-50'
        } disabled:opacity-50`}
      >
        {asiste === false ? '✓' : '✗'}
      </button>
    </div>
  )
}
