'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createPago } from '@/app/actions/pagos'
import { Button } from '@/components/ui/button'
import { Loader2, DollarSign, Calendar, Users, Save, X, Info } from 'lucide-react'

interface PagoFormProps {
  residentes: any[]
}

export function PagoForm({ residentes }: PagoFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [tipoPago, setTipoPago] = useState('')
  const [numCuotas, setNumCuotas] = useState('1')

  useEffect(() => {
    if (tipoPago === 'Garantía') {
      setNumCuotas('1')
    } else if (tipoPago.includes('Alquiler')) {
      // Si es alquiler, sugerir pago en partes (mínimo 2)
      setNumCuotas('2')
    }
  }, [tipoPago])

  async function handleSubmit(formData: FormData) {
    setError(null)
    
    const concepto = formData.get('concepto') as string
    const cuotas = parseInt(formData.get('numCuotas') as string || '1')

    // Validaciones extra
    if (concepto === 'Garantía' && cuotas > 1) {
      setError('El depósito de garantía debe ser en un solo pago.')
      return
    }
    if (concepto.includes('Alquiler') && cuotas === 1) {
      setError('Los pagos de alquiler deben ser divididos en partes.')
      return
    }

    const data = {
      residenteId: formData.get('residenteId'),
      monto: formData.get('monto'),
      concepto,
      numCuotas: cuotas,
    }

    startTransition(async () => {
      const result = await createPago(data)
      if (result.success) {
        router.push('/modules/pagos')
        router.refresh()
      } else {
        setError(result.error as string)
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/40 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-3">
          <Info size={18} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Selector de Residente */}
        <div className="space-y-3">
          <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 px-1">
            <Users size={14} className="text-[#1D9E75]" />
            Residente
          </label>
          <select
            name="residenteId"
            required
            className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-bold text-gray-700"
          >
            <option value="">Seleccionar residente...</option>
            {residentes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.user.nombre} — {r.habitacion?.residencia?.nombre || 'Sin residencia'}
              </option>
            ))}
          </select>
        </div>

        {/* Concepto del Cobro */}
        <div className="space-y-3">
          <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 px-1">
            <DollarSign size={14} className="text-[#EF9F27]" />
            Concepto del Cobro
          </label>
          <select
            name="concepto"
            required
            value={tipoPago}
            onChange={(e) => setTipoPago(e.target.value)}
            className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#EF9F27] focus:ring-4 focus:ring-[#EF9F27]/5 outline-none transition-all font-bold text-gray-700"
          >
            <option value="">Seleccionar concepto...</option>
            <option value="Garantía">Garantía (Depósito)</option>
            <option value="Primer Alquiler">Primer Alquiler</option>
            <option value="Mensualidad Alquiler">Mensualidad de Alquiler</option>
            <option value="Otros">Otros</option>
          </select>
        </div>

        {/* Monto Total */}
        <div className="space-y-3">
          <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 px-1">
            <DollarSign size={14} className="text-[#1D9E75]" />
            Monto Total a Cobrar
          </label>
          <div className="relative group">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-black text-lg group-focus-within:text-[#1D9E75] transition-colors">$</span>
            <input
              name="monto"
              type="number"
              step="0.01"
              required
              className="w-full pl-10 pr-6 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-black text-gray-900 text-lg"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Plan de Cuotas */}
        <div className="space-y-3">
          <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 px-1">
            <Calendar size={14} className="text-[#1D9E75]" />
            Número de Cuotas
          </label>
          <select
            name="numCuotas"
            value={numCuotas}
            onChange={(e) => setNumCuotas(e.target.value)}
            disabled={tipoPago === 'Garantía'}
            className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-bold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {tipoPago === 'Garantía' ? (
                <option value="1">Pago Único (Obligatorio)</option>
            ) : (
                <>
                    <option value="1" disabled={tipoPago.includes('Alquiler')}>Pago Único</option>
                    <option value="2">2 Cuotas</option>
                    <option value="3">3 Cuotas</option>
                    <option value="4">4 Cuotas</option>
                    <option value="6">6 Cuotas</option>
                    <option value="12">12 Cuotas</option>
                </>
            )}
          </select>
          <p className="px-2 text-[10px] font-black uppercase tracking-tighter text-gray-400">
            {tipoPago === 'Garantía' 
                ? 'Los depósitos de garantía no permiten pagos en partes.' 
                : 'Las cuotas se generarán con vencimiento mensual.'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 pt-8 border-t border-gray-50 mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="rounded-2xl px-8 h-12 border-gray-100 hover:bg-gray-50 text-gray-400 font-bold"
        >
          <X size={18} className="mr-2" />
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="bg-[#1D9E75] hover:bg-[#167e5d] text-white rounded-2xl px-12 h-12 shadow-xl shadow-[#1D9E75]/20 font-black transition-all"
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
