'use client'

import { useTransition } from 'react'
import { payAllCuotas } from '@/app/actions/pagos'
import { Check, Loader2 } from 'lucide-react'

export function PayAllButton({ pagoId, isDisabled }: { pagoId: number, isDisabled: boolean }) {
  const [isPending, startTransition] = useTransition()

  async function handlePayAll() {
    startTransition(async () => {
      await payAllCuotas(pagoId)
    })
  }

  if (isDisabled) return null

  return (
    <button
      onClick={handlePayAll}
      disabled={isPending}
      className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all bg-[#072E1F] text-white shadow-lg shadow-[#072E1F]/20 hover:bg-[#1D9E75] hover:shadow-[#1D9E75]/20 disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Check size={16} />
      )}
      COBRAR TODO EL SALDO
    </button>
  )
}
