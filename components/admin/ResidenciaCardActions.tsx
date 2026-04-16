'use client'

import { useState } from 'react'
import { Pencil, Trash2, X } from 'lucide-react'
import { deleteResidencia, updateResidencia } from '@/app/actions/residencias'
import { useRouter } from 'next/navigation'

export function ResidenciaCardActions({ residencia }: { residencia: any }) {
    const [loading, setLoading] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro de que deseas eliminar esta residencia?')) return
        
        setLoading(true)
        const res = await deleteResidencia(residencia.id)
        setLoading(false)
        
        if (res.success) {
            router.refresh()
        } else {
            alert(res.error)
        }
    }

    const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
        }

        const res = await updateResidencia(residencia.id, data)
        setLoading(false)
        
        if (res.success) {
            setIsEditOpen(false)
            router.refresh()
        } else {
            alert(res.error)
        }
    }

    return (
        <div className="flex gap-2">
            <button 
                onClick={() => setIsEditOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#1D9E75] transition-colors"
                title="Editar"
            >
                <Pencil size={18} />
            </button>
            <button 
                onClick={handleDelete}
                disabled={loading}
                className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                title="Eliminar"
            >
                <Trash2 size={18} />
            </button>

            {/* Modal Editar */}
            {isEditOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100">
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-[#072E1F]">Editar Residencia</h2>
                                <p className="text-sm text-gray-500 font-medium">Actualiza los detalles de {residencia.nombre}</p>
                            </div>
                            <button 
                                onClick={() => setIsEditOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleEditSubmit} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Nombre de la Residencia</label>
                                <input 
                                    name="nombre" 
                                    required 
                                    defaultValue={residencia.nombre}
                                    className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-semibold" 
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Dirección</label>
                                <input 
                                    name="direccion" 
                                    required 
                                    defaultValue={residencia.direccion}
                                    className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-semibold" 
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Capacidad</label>
                                    <input 
                                        name="capacidad" 
                                        type="number" 
                                        required 
                                        min="1"
                                        defaultValue={residencia.capacidad}
                                        className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#1D9E75] outline-none transition-all font-semibold" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Habitaciones</label>
                                    <input 
                                        name="numHabitaciones" 
                                        type="number" 
                                        required 
                                        min="0"
                                        defaultValue={residencia._count.habitaciones}
                                        className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#1D9E75] outline-none transition-all font-semibold" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Lavadoras</label>
                                    <input 
                                        name="numLavadoras" 
                                        type="number" 
                                        required 
                                        min="0"
                                        defaultValue={residencia._count.lavadoras || 0}
                                        className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#1D9E75] outline-none transition-all font-semibold" 
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Descripción Breve</label>
                                <textarea 
                                    name="descripcion" 
                                    defaultValue={residencia.descripcion}
                                    className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all h-28 resize-none font-semibold" 
                                />
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsEditOpen(false)}
                                    className="flex-1 px-6 py-4 rounded-2xl font-black text-sm text-gray-400 hover:bg-gray-100 transition-all uppercase tracking-widest"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-[#072E1F] text-white px-6 py-4 rounded-2xl font-black text-sm shadow-xl shadow-[#072E1F]/20 hover:bg-[#0a412b] transition-all disabled:opacity-50 uppercase tracking-widest"
                                >
                                    {loading ? 'Procesando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
