'use client'

import { useState, useTransition } from 'react'
import { createPago } from '@/app/actions/pagos'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Check } from 'lucide-react'

interface AsignarMontoFormProps {
    residentes: any[]
}

export function AsignarMontoForm({ residentes }: AsignarMontoFormProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [marcarPagado, setMarcarPagado] = useState(false)

    // Generar opciones de periodos (3 meses atrás, 3 adelante)
    const generatePeriods = () => {
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
        const now = new Date()
        const periods = []
        for (let i = -3; i <= 3; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
            periods.push(`${months[d.getMonth()]} ${d.getFullYear()}`)
        }
        return periods
    }

    const periodos = generatePeriods()

    async function handleOnSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        
        // Get the value of the button that triggered the submit
        // @ts-ignore
        const actionType = e.nativeEvent.submitter?.value
        const yaPagadoValue = actionType === 'paid'

        const data = {
            residenteId: formData.get('residenteId'),
            monto: formData.get('monto'),
            periodo: formData.get('periodo'),
            concepto: `Mensualidad ${formData.get('periodo')}`,
            yaPagado: yaPagadoValue,
        }

        startTransition(async () => {
            const res = await createPago(data)
            if (res.success) {
                (e.target as HTMLFormElement).reset()
                router.refresh()
            }
        })
    }

    return (
        <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-xl shadow-gray-200/30">
            <h3 className="text-sm font-black text-[#072E1F] uppercase tracking-widest mb-6">Asignar monto</h3>
            
            <form onSubmit={handleOnSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Residente</label>
                        <select
                            name="residenteId"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#1D9E75] outline-none transition-all font-bold text-gray-700 text-sm"
                        >
                            <option value="">Seleccionar...</option>
                            {residentes.map(r => (
                                <option key={r.id} value={r.id}>
                                    {r.user.nombre} — {r.habitacion?.numero || 'S/H'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Monto (S/)</label>
                        <input
                            name="monto"
                            type="number"
                            required
                            placeholder="350"
                            className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#1D9E75] outline-none transition-all font-bold text-gray-700 text-sm"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Período</label>
                    <select
                        name="periodo"
                        required
                        defaultValue={`${periodos[3]}`} // Mes actual
                        className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#1D9E75] outline-none transition-all font-bold text-gray-700 text-sm"
                    >
                        {periodos.map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-3 pt-2">
                    <button
                        type="submit"
                        name="submitButton"
                        value="assign"
                        disabled={isPending}
                        className="flex-1 bg-[#1D9E75] hover:bg-[#167e5d] text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-[#1D9E75]/20 disabled:opacity-50"
                    >
                        {isPending ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Asignar monto'}
                    </button>
                    <button
                        type="submit"
                        name="submitButton"
                        value="paid"
                        disabled={isPending}
                        className="flex-1 bg-white border border-[#1D9E75] text-[#1D9E75] hover:bg-[#1D9E75]/5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50"
                    >
                        {isPending ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Marcar como pagado'}
                    </button>
                </div>
            </form>
        </div>
    )
}
