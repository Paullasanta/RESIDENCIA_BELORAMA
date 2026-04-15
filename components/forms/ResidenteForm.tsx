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
  const residenciaSeleccionada = residencias.find(r => r.id === residenciaId)
  const habitacionesDisponibles = residenciaSeleccionada?.habitaciones || []

  async function handleSubmit(formData: FormData) {
    setError(null)
    const data = Object.fromEntries(formData.entries())
    
    startTransition(async () => {
      const result = initialData 
        ? await updateResidente(initialData.id, data)
        : await createResidente(data)

      if (result.success) {
        router.push('/admin/residentes')
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">Nombre Completo</label>
          <input
            name="nombre"
            defaultValue={initialData?.user?.nombre}
            required
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/20 outline-none transition-all"
            placeholder="Ej. Juan Pérez"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">Correo Electrónico</label>
          <input
            name="email"
            type="email"
            defaultValue={initialData?.user?.email}
            required
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/20 outline-none transition-all"
            placeholder="juan@email.com"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">
            Contraseña {initialData && <span className="text-xs font-normal text-gray-400">(Dejar en blanco para no cambiar)</span>}
          </label>
          <input
            name="password"
            type="password"
            required={!initialData}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/20 outline-none transition-all"
            placeholder="••••••••"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">Residencia</label>
          <select
            name="residenciaId"
            value={residenciaId}
            onChange={(e) => {
              setResidenciaId(e.target.value)
              setHabitacionId('') // Reset habitacion when residencia changes
            }}
            required
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/20 outline-none transition-all bg-white"
          >
            <option value="">Seleccionar residencia...</option>
            {residencias.map((res) => (
              <option key={res.id} value={res.id}>{res.nombre}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">Habitación</label>
          <select
            name="habitacionId"
            value={habitacionId}
            onChange={(e) => setHabitacionId(e.target.value)}
            required
            disabled={!residenciaId}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/20 outline-none transition-all bg-white disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">Seleccionar habitación...</option>
            {/* Si es edición, mostramos la habitación actual aunque no esté "disponible" en la lista general */}
            {initialData?.habitacion && !habitacionesDisponibles.find((h:any) => h.id === initialData.habitacionId) && (
                <option value={initialData.habitacionId}>
                    Hab. {initialData.habitacion.numero} (Actual)
                </option>
            )}
            {habitacionesDisponibles.map((hab: any) => (
              <option key={hab.id} value={hab.id}>Hab. {hab.numero} (Piso {hab.piso})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-50">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="rounded-xl"
        >
          <X size={18} className="mr-2" />
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="bg-[#1D9E75] hover:bg-[#167e5d] text-white rounded-xl px-8 shadow-lg shadow-[#1D9E75]/20"
        >
          {isPending ? (
            <Loader2 size={18} className="animate-spin mr-2" />
          ) : (
            <Save size={18} className="mr-2" />
          )}
          {initialData ? 'Actualizar Residente' : 'Crear Residente'}
        </Button>
      </div>
    </form>
  )
}
