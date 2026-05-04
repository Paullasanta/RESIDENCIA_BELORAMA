'use client'

import { useState } from 'react'
import { Plus, X, WashingMachine } from 'lucide-react'
import { createLavadora } from '@/app/actions/lavanderia'
import { useRouter } from 'next/navigation'

export function AddLavadoraButton({ residencias }: { residencias: any[] }) {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        const formData = new FormData(e.currentTarget)
        const nombre = formData.get('nombre') as string
        const residenciaId = Number(formData.get('residenciaId'))

        const result = await createLavadora(residenciaId, nombre)
        if (result.success) {
            setIsOpen(false)
            router.refresh()
        } else {
            setError(result.error || 'Error al crear la lavadora')
        }
        setLoading(false)
    }

    if (residencias.length === 0) return null

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                className="bg-[#1D9E75] text-white h-12 px-6 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-[0.15em] shadow-xl shadow-[#1D9E75]/20 hover:bg-[#157a5a] active:scale-95 transition-all"
            >
                <Plus size={18} strokeWidth={3} /> 
                <span>Nueva Lavadora</span>
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-50 text-blue-500 rounded-xl">
                                    <WashingMachine size={24} />
                                </div>
                                <h2 className="text-xl font-black text-[#072E1F]">Registrar Lavadora</h2>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-200 rounded-xl text-gray-400 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 uppercase tracking-wider text-center">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nombre o Etiqueta</label>
                                <input name="nombre" placeholder="Ej: Lavadora 1 - LG, P1" required className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-[#1D9E75] outline-none font-bold placeholder-gray-300 transition-all" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Residencia Destino</label>
                                <select name="residenciaId" required className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-[#1D9E75] outline-none font-bold text-gray-600 transition-all appearance-none">
                                    {residencias.map(res => (
                                        <option key={res.id} value={res.id}>{res.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <button type="submit" disabled={loading} className="w-full bg-[#072E1F] text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#072E1F]/20 hover:bg-[#0a412b] transition-all disabled:opacity-50">
                                {loading ? 'Creando...' : 'Crear Lavadora'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
