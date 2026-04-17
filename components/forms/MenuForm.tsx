'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createMenu } from '@/app/actions/comida'
import { Loader2, Save, X, Utensils, Calendar, Building } from 'lucide-react'

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

    const data = {
      nombre: formData.get('nombre'),
      descripcion: formData.get('descripcion'),
      tipo: formData.get('tipo'),
      fecha: formData.get('fecha'),
      residenciaIds: selectedResidencias
    }

    startTransition(async () => {
      const result = await createMenu(data)
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
    <form action={handleSubmit} className="space-y-8 bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/50 max-w-4xl mx-auto">
      {error && (
        <div className="p-5 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-3">
           <span className="w-2 h-2 bg-red-500 rounded-full" />
           {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2 col-span-full">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
            <Utensils size={14} className="text-[#1D9E75]" /> Nombre del Menú
          </label>
          <input
            name="nombre"
            required
            className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-black text-gray-700 placeholder:text-gray-300"
            placeholder="Ej. Tallarines Verdes con Pollo"
          />
        </div>

        <div className="space-y-2 col-span-full">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Descripción (Opcional)</label>
          <textarea
            name="descripcion"
            rows={3}
            className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-medium text-gray-700 placeholder:text-gray-300 resize-none"
            placeholder="Detalles sobre el menú o ingredientes..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
            <Utensils size={14} className="text-[#1D9E75]" /> Tipo de Comida
          </label>
          <select
            name="tipo"
            required
            className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-black text-gray-700 appearance-none cursor-pointer"
          >
            <option value="DESAYUNO">Desayuno</option>
            <option value="ALMUERZO">Almuerzo</option>
            <option value="CENA">Cena</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
            <Calendar size={14} className="text-[#1D9E75]" /> Fecha Programada
          </label>
          <input
            name="fecha"
            type="date"
            required
            defaultValue={new Date().toISOString().split('T')[0]}
            className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-black text-gray-700"
          />
        </div>

        {/* Selección de Residencias */}
        <div className="space-y-4 col-span-full pt-4 border-t border-gray-50">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
            <Building size={14} className="text-[#1D9E75]" /> Disponible en Residencias
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {residencias.map((res) => (
              <button
                key={res.id}
                type="button"
                onClick={() => toggleResidencia(res.id)}
                className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between group ${
                  selectedResidencias.includes(res.id)
                    ? 'bg-[#1D9E75]/5 border-[#1D9E75] shadow-sm shadow-[#1D9E75]/10'
                    : 'bg-white border-gray-100 hover:border-gray-200'
                }`}
              >
                <div>
                  <p className={`text-sm font-black ${selectedResidencias.includes(res.id) ? 'text-[#1D9E75]' : 'text-gray-700'}`}>
                    {res.nombre}
                  </p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {res.direccion}
                  </p>
                </div>
                {selectedResidencias.includes(res.id) && (
                  <div className="w-5 h-5 rounded-full bg-[#1D9E75] flex items-center justify-center text-white">
                    <Save size={10} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
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
          Publicar Menú
        </button>
      </div>
    </form>
  )
}
