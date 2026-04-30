'use client'

import { useTransition } from 'react'
import { togglePagoStatus, payPago } from '@/app/actions/pagos'
import { Check, Loader2, XCircle } from 'lucide-react'

export function TogglePagoButton({ id, pagado }: { id: number, pagado: boolean }) {
  const [isPending, startTransition] = useTransition()

  async function handleToggle() {
    startTransition(async () => {
      await togglePagoStatus(id, !pagado)
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
        pagado 
          ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100' 
          : 'bg-[#1D9E75] text-white shadow-lg shadow-[#1D9E75]/20 hover:bg-[#167e5d]'
      } disabled:opacity-50`}
    >
      {isPending ? (
        <Loader2 size={14} className="animate-spin" />
      ) : pagado ? (
        <>
            <XCircle size={14} />
            MARCAR PENDIENTE
        </>
      ) : (
        <>
            <Check size={14} />
            MARCAR PAGADO
        </>
      )}
    </button>
  )
}

export function PayPagoButton({ pagoId, isPaid }: { pagoId: number, isPaid: boolean }) {
  const [isPending, startTransition] = useTransition()

  async function handlePayAll() {
    startTransition(async () => {
      await payPago(pagoId)
    })
  }

  if (isPaid) return null

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
      COBRAR PAGO
    </button>
  )
}
