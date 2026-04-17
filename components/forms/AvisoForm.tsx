'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createAviso } from '@/app/actions/avisos'
import { Loader2, Save, X, Megaphone, MapPin, AlertTriangle, Image as ImageIcon, Plus, Trash2 } from 'lucide-react'

interface AvisoFormProps {
  residencias: any[]
}

export function AvisoForm({ residencias }: AvisoFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [fotos, setFotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setError(null)

    try {
      const newUrls = [...fotos]
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) throw new Error('Error al subir archivo')
        const result = await response.json()
        newUrls.push(result.url)
      }
      setFotos(newUrls)
    } catch (err) {
      setError('Hubo un problema al subir las imágenes.')
    } finally {
      setUploading(false)
    }
  }

  const removeFoto = (index: number) => {
    setFotos(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(formData: FormData) {
    const data = {
      titulo: formData.get('titulo'),
      contenido: formData.get('contenido'),
      prioridad: formData.get('prioridad'),
      residenciaId: formData.get('residenciaId') || null,
      fotos: fotos
    }

    startTransition(async () => {
      const result = await createAviso(data)
      if (result.success) {
        router.push('/modules/avisos')
        router.refresh()
      } else {
        setError(result.error as string)
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-8 bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/50 max-w-3xl mx-auto">
      {error && (
        <div className="p-5 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-3">
           <span className="w-2 h-2 bg-red-500 rounded-full" />
           {error}
        </div>
      )}

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
            <Megaphone size={14} className="text-[#1D9E75]" /> Título del Aviso
          </label>
          <input
            name="titulo"
            required
            className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-black text-gray-700 placeholder:text-gray-300"
            placeholder="Ej. Mantenimiento de Agua, Nueva Normativa..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Contenido del Comunicado</label>
          <textarea
            name="contenido"
            required
            rows={5}
            className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-medium text-gray-700 placeholder:text-gray-300 resize-none"
            placeholder="Escribe aquí el mensaje detallado para los residentes..."
          />
        </div>

        {/* Sección: Fotos del Aviso */}
        <div className="space-y-4 pt-4 border-t border-gray-50">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <ImageIcon size={14} className="text-[#1D9E75]" /> Archivos Adjuntos / Fotos
          </label>
          
          <div className="flex flex-wrap gap-4">
             <label className={`w-24 h-24 rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center cursor-pointer hover:border-[#1D9E75] hover:bg-green-50/30 transition-all group relative overflow-hidden ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <input type="file" className="hidden" accept="image/*" multiple onChange={handleFileUpload} />
                {uploading ? (
                    <Loader2 size={18} className="animate-spin text-[#1D9E75]" />
                ) : (
                    <>
                        <Plus size={20} className="text-gray-300 group-hover:text-[#1D9E75] transition-colors" />
                        <span className="text-[8px] font-black text-gray-300 mt-1 uppercase">Añadir</span>
                    </>
                )}
             </label>

             {fotos.map((url, i) => (
                <div key={i} className="w-24 h-24 rounded-2xl bg-gray-100 border border-gray-100 overflow-hidden relative group shadow-sm">
                    <img src={url} alt="Aviso" className="w-full h-full object-cover" />
                    <button
                        type="button"
                        onClick={() => removeFoto(i)}
                        className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
             ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <AlertTriangle size={14} className="text-[#EF9F27]" /> Prioridad
                </label>
                <select
                    name="prioridad"
                    required
                    className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-black text-gray-700 appearance-none cursor-pointer"
                >
                    <option value="NORMAL">Normal</option>
                    <option value="IMPORTANTE">Importante</option>
                    <option value="URGENTE">Urgente</option>
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <MapPin size={14} className="text-[#1D9E75]" /> Dirigido a:
                </label>
                <select
                    name="residenciaId"
                    className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-black text-gray-700 appearance-none cursor-pointer"
                >
                    <option value="">Todas las Residencias (Global)</option>
                    {residencias.map((res) => (
                    <option key={res.id} value={res.id}>{res.nombre}</option>
                    ))}
                </select>
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
          Publicar Comunicado
        </button>
      </div>
    </form>
  )
}
