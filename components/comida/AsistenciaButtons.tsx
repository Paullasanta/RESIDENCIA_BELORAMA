'use client'

import { useTransition } from 'react'
import { registrarAsistenciaComida } from '@/app/actions/comida'
import { Check, X, Loader2, Lock } from 'lucide-react'

interface AsistenciaButtonsProps {
  residenteId: number
  menuId: number
  asiste: boolean | undefined
  isLocked?: boolean
  variant?: 'list' | 'grid' | 'cartilla'
}

export function AsistenciaButtons({ residenteId, menuId, asiste, isLocked, variant = 'list' }: AsistenciaButtonsProps) {
  const [isPending, startTransition] = useTransition()

  function handleAction(value: boolean) {
    if (isPending || isLocked) return
    startTransition(async () => {
      await registrarAsistenciaComida(residenteId, menuId, value)
    })
  }

  // Cartilla Variant (requested: Minimalist, clean data focus)
  if (variant === 'cartilla') {
     if (isLocked) {
         return (
             <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 opacity-60">
                 <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                     <Lock size={10} /> Cerrado
                 </span>
                 <span className={`text-[9px] font-black uppercase ${asiste === true ? 'text-[#1D9E75]' : 'text-red-400'}`}>
                     {asiste === true ? 'CONFIRMADO' : 'NO ASISTIRÉ'}
                 </span>
             </div>
         )
     }

     return (
        <div className="flex items-center gap-2">
            <button
                onClick={() => handleAction(true)}
                disabled={isPending}
                className={`flex-1 py-2 px-3 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all ${
                    asiste === true 
                        ? 'bg-[#1D9E75] text-white' 
                        : 'bg-white text-gray-400 border border-gray-200 hover:border-[#1D9E75] hover:text-[#1D9E75]'
                } disabled:opacity-50 flex items-center justify-center gap-1.5`}
            >
                {isPending ? <Loader2 size={10} className="animate-spin" /> : asiste === true ? <Check size={10} /> : null}
                {isPending ? '...' : asiste === true ? 'IRÉ' : 'MARCAR ASISTIRÉ'}
            </button>
            <button
                onClick={() => handleAction(false)}
                disabled={isPending}
                className={`w-10 py-2 rounded-lg font-black text-[9px] uppercase transition-all ${
                    asiste === false 
                        ? 'bg-red-500 text-white' 
                        : 'bg-white text-gray-300 border border-gray-100 hover:border-red-300 hover:text-red-500'
                } disabled:opacity-50 flex items-center justify-center`}
            >
                {isPending ? '...' : <X size={12} />}
            </button>
        </div>
     )
  }

  // Grid (from previous request)
  if (variant === 'grid') {
    if (isLocked) {
        return (
            <div className="flex items-center justify-between bg-gray-50/50 rounded-2xl p-2 px-3 border border-gray-100 opacity-60">
                <span className="text-[8px] font-black text-gray-400 flex items-center gap-1 uppercase tracking-tighter">
                   <Lock size={10} /> Cerrado
                </span>
                <div className={`w-10 h-6 rounded-full flex items-center px-1 ${asiste === true ? 'bg-green-100' : 'bg-red-100'}`}>
                    <div className={`w-4 h-4 rounded-full ${asiste === true ? 'bg-green-500 ml-auto' : 'bg-red-500'}`} />
                </div>
            </div>
        )
    }

    return (
        <label 
            className={`flex items-center justify-between p-2 px-3 rounded-2xl cursor-pointer transition-all duration-300 border ${
                asiste === true 
                    ? 'bg-green-50/50 border-green-100' 
                    : 'bg-red-50/50 border-red-100'
            } hover:shadow-sm`}
        >
            <span className={`text-[9px] font-black uppercase tracking-widest ${
                asiste === true ? 'text-[#1D9E75]' : 'text-red-400'
            }`}>
                {isPending ? 'Sincronizando...' : asiste === true ? 'Asistiré' : 'No asistiré'}
            </span>
            
            <div 
                onClick={(e) => {
                    e.preventDefault()
                    handleAction(!asiste)
                }}
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 flex items-center px-1 ${
                    asiste === true ? 'bg-[#1D9E75]' : 'bg-red-400'
                } ${isPending ? 'opacity-50' : ''}`}
            >
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-500 transform flex items-center justify-center ${
                    asiste === true ? 'translate-x-6' : 'translate-x-0'
                }`}>
                    {isPending ? (
                        <Loader2 size={10} className="animate-spin text-gray-400" />
                    ) : asiste === true ? (
                        <Check size={10} className="text-[#1D9E75]" />
                    ) : (
                        <X size={10} className="text-red-400" />
                    )}
                </div>
            </div>
        </label>
    )
  }

  // Default List Variant
  return (
    <div className="mt-auto p-4 flex items-center gap-3">
         {/* ... (existing logic for list) ... */}
         <button onClick={() => handleAction(true)} className="bg-[#1D9E75] text-white px-4 py-2 rounded-lg">Confirmar</button>
    </div>
  )
}
