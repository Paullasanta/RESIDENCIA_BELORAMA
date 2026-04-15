'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createPago } from '@/app/actions/pagos'
import { Button } from '@/components/ui/button'
import { Loader2, DollarSign, Calendar, Users, Save, X } from 'lucide-react'

interface PagoFormProps {
  residentes: any[]
}

export function PagoForm({ residentes }: PagoFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)
    const data = {
      residenteId: formData.get('residenteId'),
      monto: formData.get('monto'),
      numCuotas: parseInt(formData.get('numCuotas') as string || '0'),
    }

    startTransition(async () => {
      const result = await createPago(data)
      if (result.success) {
        router.push('/admin/pagos')
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm italic">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Selector de Residente */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <Users size={16} className="text-[#1D9E75]" />
            Residente
          </label>
          <select
            name="residenteId"
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/20 outline-none transition-all bg-white"
          >
            <option value="">Seleccionar residente...</option>
            {residentes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.user.nombre} — {r.habitacion?.residencia?.nombre || 'Sin residencia'}
              </option>
            ))}
          </select>
        </div>

        {/* Monto Total */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <DollarSign size={16} className="text-[#1D9E75]" />
            Monto Total a Cobrar
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
            <input
              name="monto"
              type="number"
              step="0.01"
              required
              className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/20 outline-none transition-all"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Plan de Cuotas */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <Calendar size={16} className="text-[#1D9E75]" />
            Número de Cuotas
          </label>
          <select
            name="numCuotas"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/20 outline-none transition-all bg-white"
          >
            <option value="1">Pago Único (1 cuota)</option>
            <option value="2">2 Cuotas</option>
            <option value="3">3 Cuotas</option>
            <option value="6">6 Cuotas</option>
            <option value="12">12 Cuotas</option>
          </select>
          <p className="text-xs text-gray-400">Las cuotas se generarán con vencimiento mensual a partir de hoy.</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-50">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="rounded-xl px-6"
        >
          <X size={18} className="mr-2" />
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="bg-[#1D9E75] hover:bg-[#167e5d] text-white rounded-xl px-10 shadow-lg shadow-[#1D9E75]/20 h-11"
        >
          {isPending ? (
            <Loader2 size={18} className="animate-spin mr-2" />
          ) : (
            <Save size={18} className="mr-2" />
          )}
          Registrar Cobro
        </Button>
      </div>
    </form>
  )
}
