'use client'

import { useTransition } from 'react'
import { updateCuota } from '@/app/actions/pagos'
import { Check, Loader2 } from 'lucide-react'

export function PayCuotaButton({ id, pagado }: { id: number, pagado: boolean }) {
  const [isPending, startTransition] = useTransition()

  async function handleToggle() {
    startTransition(async () => {
      await updateCuota(id, !pagado)
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
        pagado 
          ? 'bg-green-50 text-green-600 border border-green-100' 
          : 'bg-[#1D9E75] text-white shadow-lg shadow-[#1D9E75]/20 hover:bg-[#167e5d]'
      } disabled:opacity-50`}
    >
      {isPending ? (
        <Loader2 size={14} className="animate-spin" />
      ) : pagado ? (
        <>
            <Check size={14} />
            PAGADO
        </>
      ) : (
        'MARCAR COMO PAGADO'
      )}
    </button>
  )
}
