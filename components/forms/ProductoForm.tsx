'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { createProducto } from '@/app/actions/marketplace'
import { Loader2, Save, X, DollarSign, Image as ImageIcon, Plus, Trash2 } from 'lucide-react'

export function ProductoForm() {
  const router = useRouter()
  const { data: session } = useSession()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [fotos, setFotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [precio, setPrecio] = useState('0')

  const handleNumericInput = (val: string) => {
    let filtered = val.replace(/[^0-9.]/g, '');
    const parts = filtered.split('.');
    if (parts.length > 2) filtered = parts[0] + '.' + parts.slice(1).join('');
    return filtered;
  }

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
        formData.append('folder', 'productos')
        formData.append('prefix', 'pd')
        formData.append('dni', (session?.user as any)?.dni || '00000000')

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
    if (fotos.length === 0) {
      setError('Debes subir al menos una foto del producto.')
      return
    }

    const data = {
      titulo: formData.get('titulo'),
      precio: Number(precio),
      descripcion: formData.get('descripcion'),
      fotos: fotos
    }

    startTransition(async () => {
      const result = await createProducto(data)
      if (result.success) {
        router.push('/modules/marketplace')
        router.refresh()
      } else {
        setError(result.error as string)
      }
    })
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
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Título del Producto</label>
          <input
            name="titulo"
            required
            className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-black text-gray-700 placeholder:text-gray-300"
            placeholder="Ej. Silla de oficina ergonómica"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Precio ($)</label>
          <div className="relative group/input">
            <span className="absolute left-6 inset-y-0 flex items-center text-gray-300 font-black group-focus-within/input:text-[#1D9E75] transition-colors">$</span>
            <input
              name="precio"
              type="text"
              required
              value={precio}
              onChange={(e) => setPrecio(handleNumericInput(e.target.value))}
              inputMode="decimal"
              className="w-full pl-12 pr-6 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-black text-gray-700"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="space-y-2 col-span-full">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Descripción</label>
          <textarea
            name="descripcion"
            rows={4}
            className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-medium text-gray-700 placeholder:text-gray-300 resize-none"
            placeholder="Describe el estado del producto, tiempo de uso, etc."
          />
        </div>

        {/* Sección: Fotos (Upload Real) */}
        <div className="space-y-6 col-span-full pt-4 border-t border-gray-50">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <ImageIcon size={14} className="text-[#1D9E75]" /> Fotos del Producto
          </label>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
             {/* Caja de subida */}
             <label className={`aspect-square rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center cursor-pointer hover:border-[#1D9E75] hover:bg-green-50/30 transition-all group relative overflow-hidden ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    multiple 
                    onChange={handleFileUpload}
                />
                {uploading ? (
                    <Loader2 size={24} className="animate-spin text-[#1D9E75]" />
                ) : (
                    <>
                        <Plus size={24} className="text-gray-300 group-hover:text-[#1D9E75] transition-colors" />
                        <span className="text-[10px] font-black text-gray-300 mt-2 uppercase">Añadir</span>
                    </>
                )}
             </label>

             {/* Previews */}
             {fotos.map((url, i) => (
                <div key={i} className="aspect-square rounded-3xl bg-gray-100 border border-gray-100 overflow-hidden relative group shadow-sm">
                    <img src={url} alt="Vista previa" className="w-full h-full object-cover" />
                    <button
                        type="button"
                        onClick={() => removeFoto(i)}
                        className="absolute top-2 right-2 w-8 h-8 rounded-xl bg-red-500 text-white flex items-center justify-center translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all shadow-lg"
                    >
                        <Trash2 size={14} />
                    </button>
                    {i === 0 && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-sm p-1.5 flex justify-center">
                            <span className="text-[8px] font-black text-white uppercase tracking-widest">Portada</span>
                        </div>
                    )}
                </div>
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
          Publicar Producto
        </button>
      </div>
    </form>
  )
}
