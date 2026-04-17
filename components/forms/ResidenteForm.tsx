'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createResidente, updateResidente } from '@/app/actions/residentes'
import { Button } from '@/components/ui/button'
import { Loader2, Save, X } from 'lucide-react'

interface ResidenteFormProps {
  residencias: any[]
  initialData?: any
}

export function ResidenteForm({ residencias, initialData }: ResidenteFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [residenciaId, setResidenciaId] = useState(initialData?.user?.residenciaId || '')
  const [habitacionId, setHabitacionId] = useState(initialData?.habitacionId || '')

  // Filtrar habitaciones disponibles de la residencia seleccionada
  const residenciaSeleccionada = residencias.find(r => r.id.toString() === residenciaId.toString())
  const habitacionesDisponibles = residenciaSeleccionada?.habitaciones || []

  async function handleSubmit(formData: FormData) {
    setError(null)
    const data = Object.fromEntries(formData.entries())

    startTransition(async () => {
      const result = initialData
        ? await updateResidente(initialData.id, data)
        : await createResidente(data)

      if (result.success) {
        router.push('/modules/residentes')
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-8 bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/50">
      {error && (
        <div className="p-5 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in shake duration-500">
           <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
           {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Sección: Información Personal */}
        <div className="space-y-6 col-span-full">
            <h3 className="text-sm font-black text-[#1D9E75] uppercase tracking-[0.2em] mb-2">Información Personal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                <input
                    name="nombre"
                    defaultValue={initialData?.user?.nombre}
                    required
                    className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                    placeholder="Ej. Juan Pérez"
                />
                </div>

                <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                <input
                    name="email"
                    type="email"
                    defaultValue={initialData?.user?.email}
                    required
                    className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                    placeholder="juan@email.com"
                />
                </div>
            </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
            Contraseña {initialData && <span className="text-[10px] font-bold text-[#EF9F27] ml-2">(Opcional)</span>}
          </label>
          <input
            name="password"
            type="password"
            required={!initialData}
            className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
            placeholder="••••••••"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Residencia</label>
          <select
            name="residenciaId"
            value={residenciaId}
            onChange={(e) => {
              setResidenciaId(e.target.value)
              setHabitacionId('') // Reset habitacion when residencia changes
            }}
            required
            className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-bold text-gray-700 appearance-none cursor-pointer"
          >
            <option value="">Seleccionar residencia...</option>
            {residencias.map((res) => (
              <option key={res.id} value={res.id}>{res.nombre}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Habitación</label>
          <select
            name="habitacionId"
            value={habitacionId}
            onChange={(e) => setHabitacionId(e.target.value)}
            required
            disabled={!residenciaId}
            className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-bold text-gray-700 appearance-none cursor-pointer disabled:opacity-50"
          >
            <option value="">Seleccionar habitación...</option>
            {initialData?.habitacion && !habitacionesDisponibles.find((h: any) => h.id.toString() === initialData.habitacionId.toString()) && (
              <option value={initialData.habitacionId.toString()}>
                Hab. {initialData.habitacion.numero} (Actual)
              </option>
            )}
            {habitacionesDisponibles.map((hab: any) => (
              <option key={hab.id} value={hab.id}>Hab. {hab.numero} (Piso {hab.piso})</option>
            ))}
          </select>
        </div>

        {!initialData && (
          <>
            <div className="pt-8 mt-4 border-t border-gray-50 col-span-full">
              <h3 className="text-sm font-black text-[#EF9F27] uppercase tracking-[0.2em] mb-2">Configuración Financiera Inicial</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">Se generarán los registros de deuda correspondientes.</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Monto Mensual (Renta)</label>
              <div className="relative group/input">
                <span className="absolute left-5 inset-y-0 flex items-center text-gray-300 font-black group-focus-within/input:text-[#1D9E75] transition-colors">$</span>
                <input
                  name="montoMensual"
                  type="number"
                  step="0.01"
                  defaultValue="0"
                  className="w-full pl-10 pr-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-black text-gray-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Garantía (Total)</label>
              <div className="relative group/input">
                <span className="absolute left-5 inset-y-0 flex items-center text-gray-300 font-black group-focus-within/input:text-[#1D9E75] transition-colors">$</span>
                <input
                  name="montoGarantia"
                  type="number"
                  step="0.01"
                  defaultValue="0"
                  className="w-full pl-10 pr-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-black text-gray-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Dividir Garantía en</label>
              <select
                name="cuotasGarantia"
                className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-black text-gray-700 appearance-none cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? 'parte' : 'partes'}</option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-end gap-4 pt-10 border-t border-gray-50">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-8 py-4 rounded-2xl text-xs font-black text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all uppercase tracking-widest"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="bg-[#1D9E75] hover:bg-[#167e5d] text-white rounded-2xl px-12 py-4 font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-[#1D9E75]/20 disabled:opacity-50 flex items-center gap-3"
        >
          {isPending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          {initialData ? 'Actualizar Perfil' : 'Dar de Alta Residente'}
        </button>
      </div>
    </form>
  )
}
