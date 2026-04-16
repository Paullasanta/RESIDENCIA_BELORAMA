'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { createResidencia } from '@/app/actions/residencias'
import { useRouter } from 'next/navigation'

export function AddResidenciaButton() {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        
        const formData = new FormData(e.currentTarget)
        const data = {
            nombre: formData.get('nombre') as string,
            direccion: formData.get('direccion') as string,
            capacidad: Number(formData.get('capacidad')),
            numHabitaciones: Number(formData.get('numHabitaciones')),
            numLavadoras: Number(formData.get('numLavadoras')),
            descripcion: formData.get('descripcion') as string,
            activa: true,
        }

        const res = await createResidencia(data)
        setLoading(false)
        
        if (res.success) {
            setIsOpen(false)
            router.refresh()
        } else {
            alert(res.error)
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 bg-[#1D9E75] hover:bg-[#15805d] text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-[#1D9E75]/20 transition-all active:scale-95"
            >
                <Plus size={18} />
                Nueva Residencia
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-[#072E1F]">Crear Residencia</h2>
                            <p className="text-sm text-gray-500">Ingresa los datos del nuevo centro.</p>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">Nombre</label>
                                <input name="nombre" required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/10 outline-none transition-all" />
                            </div>
                            
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">Dirección</label>
                                <input name="direccion" required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/10 outline-none transition-all" />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Capacidad Total</label>
                                    <input name="capacidad" type="number" required defaultValue="20" min="1" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/10 outline-none transition-all" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Habitaciones</label>
                                    <input name="numHabitaciones" type="number" required defaultValue="5" min="0" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/10 outline-none transition-all" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Lavadoras</label>
                                    <input name="numLavadoras" type="number" required defaultValue="1" min="0" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/10 outline-none transition-all" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">Descripción (Opcional)</label>
                                <textarea name="descripcion" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/10 outline-none transition-all h-24 resize-none" />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-[#072E1F] text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-[#072E1F]/20 hover:bg-[#0a412b] transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
