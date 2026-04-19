'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { publishDailyMenu } from '@/app/actions/comida'
import { Loader2, Save, X, Utensils, Calendar, Building, Clock } from 'lucide-react'

interface MenuFormProps {
  residencias: any[]
}

export function MenuForm({ residencias }: MenuFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [selectedResidencias, setSelectedResidencias] = useState<number[]>([])

  async function handleSubmit(formData: FormData) {
    if (selectedResidencias.length === 0) {
      setError('Debes seleccionar al menos una residencia.')
      return
    }

    const fecha = formData.get('fecha')
    const fechaLimite = formData.get('fechaLimite')

    const data = {
      fecha,
      fechaLimite,
      residenciaIds: selectedResidencias,
      desayuno: {
        nombre: formData.get('desayuno_nombre'),
        descripcion: formData.get('desayuno_descripcion')
      },
      almuerzo: {
        nombre: formData.get('almuerzo_nombre'),
        descripcion: formData.get('almuerzo_descripcion')
      },
      cena: {
        nombre: formData.get('cena_nombre'),
        descripcion: formData.get('cena_descripcion')
      }
    }

    if (!data.desayuno.nombre && !data.almuerzo.nombre && !data.cena.nombre) {
      setError('Debes ingresar al menos un menú (Desayuno, Almuerzo o Cena).')
      return;
    }

    startTransition(async () => {
      const result = await publishDailyMenu(data)
      if (result.success) {
        router.push('/modules/comida')
        router.refresh()
      } else {
        setError(result.error as string)
      }
    })
  }

  const toggleResidencia = (id: number) => {
    setSelectedResidencias(prev => 
      prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]
    )
  }

  return (
    <form action={handleSubmit} className="space-y-8 max-w-5xl mx-auto">
      {error && (
        <div className="p-5 bg-red-50 border border-red-100 text-red-600 rounded-[1.5rem] text-sm font-bold flex items-center gap-3 shadow-sm">
           <span className="w-2 h-2 bg-red-500 rounded-full" />
           {error}
        </div>
      )}

      {/* Configuración de Fechas */}
      <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40">
        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Calendar size={16} className="text-[#1D9E75]" /> 1. Fechas y Horarios
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                Fecha del Menú
              </label>
              <input
                name="fecha"
                type="date"
                required
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-black text-gray-700"
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                Límite para Confirmar (Opcional)
              </label>
              <input
                name="fechaLimite"
                type="datetime-local"
                className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-black text-gray-700"
              />
              <p className="text-[10px] text-gray-400 font-bold">Pasada esta fecha, nadie podrá cambiar su asistencia.</p>
            </div>
        </div>
      </div>

      {/* Bloques de Comida */}
      <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-2 mt-8">
          <Utensils size={16} className="text-[#1D9E75]" /> 2. Raciones del Día
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Desayuno */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 space-y-4">
              <div className="px-4 py-2 bg-orange-50 text-orange-700 rounded-xl text-[10px] font-black uppercase tracking-widest w-max mb-4 border border-orange-100">Desayuno</div>
              <input
                  name="desayuno_nombre"
                  placeholder="Ej. Huevos revueltos"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-black text-gray-700 text-sm placeholder:text-gray-300"
              />
              <textarea
                  name="desayuno_descripcion"
                  rows={2}
                  placeholder="Descripción opcional..."
                  className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-medium text-gray-700 text-xs placeholder:text-gray-300 resize-none"
              />
          </div>

          {/* Almuerzo */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 space-y-4">
              <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-widest w-max mb-4 border border-blue-100">Almuerzo</div>
              <input
                  name="almuerzo_nombre"
                  placeholder="Ej. Pollo al horno con puré"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-black text-gray-700 text-sm placeholder:text-gray-300"
              />
              <textarea
                  name="almuerzo_descripcion"
                  rows={2}
                  placeholder="Descripción opcional..."
                  className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-medium text-gray-700 text-xs placeholder:text-gray-300 resize-none"
              />
          </div>

          {/* Cena */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 space-y-4">
              <div className="px-4 py-2 bg-purple-50 text-purple-700 rounded-xl text-[10px] font-black uppercase tracking-widest w-max mb-4 border border-purple-100">Cena</div>
              <input
                  name="cena_nombre"
                  placeholder="Ej. Sopa y pan frito"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-black text-gray-700 text-sm placeholder:text-gray-300"
              />
              <textarea
                  name="cena_descripcion"
                  rows={2}
                  placeholder="Descripción opcional..."
                  className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-medium text-gray-700 text-xs placeholder:text-gray-300 resize-none"
              />
          </div>
      </div>

      {/* Selección de Residencias */}
      <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40">
        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Building size={16} className="text-[#1D9E75]" /> 3. Disponible en Residencias
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {residencias.map((res) => (
            <button
              key={res.id}
              type="button"
              onClick={() => toggleResidencia(res.id)}
              className={`p-5 rounded-[1.5rem] border text-left transition-all flex items-center justify-between group ${
                selectedResidencias.includes(res.id)
                  ? 'bg-[#1D9E75]/5 border-[#1D9E75] shadow-sm shadow-[#1D9E75]/10'
                  : 'bg-gray-50/50 border-gray-100 hover:border-gray-200 hover:bg-white'
              }`}
            >
              <div>
                <p className={`text-sm font-black mb-1 ${selectedResidencias.includes(res.id) ? 'text-[#1D9E75]' : 'text-gray-700'}`}>
                  {res.nombre}
                </p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {res.direccion}
                </p>
              </div>
              {selectedResidencias.includes(res.id) && (
                <div className="w-6 h-6 rounded-full bg-[#1D9E75] flex items-center justify-center text-white shadow-sm">
                  <Save size={12} />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-8 py-4 rounded-2xl text-[11px] font-black text-gray-400 hover:text-gray-600 hover:bg-white transition-all uppercase tracking-widest"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="bg-[#1D9E75] hover:bg-[#167e5d] text-white rounded-[1.5rem] px-10 py-4 font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-[#1D9E75]/20 disabled:opacity-50 flex items-center gap-3"
        >
          {isPending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          Publicar Plan Diario
        </button>
      </div>
    </form>
  )
}
