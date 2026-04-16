'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { createHabitacion } from '@/app/actions/habitaciones'
import { useRouter } from 'next/navigation'

export function AddHabitacionButton({ residenciaId }: { residenciaId: number }) {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        
        const formData = new FormData(e.currentTarget)
        const data = {
            residenciaId,
            numero: formData.get('numero') as string,
            piso: Number(formData.get('piso')),
            capacidad: Number(formData.get('capacidad')),
            estado: formData.get('estado') as any,
        }

        const res = await createHabitacion(data)
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
                className="flex items-center gap-2 bg-[#1D9E75] hover:bg-[#15805d] text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-[#1D9E75]/20 transition-all active:scale-95"
            >
                <Plus size={18} />
                Nueva Habitación
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 border border-gray-100">
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-black text-[#072E1F]">Registrar Habitación</h2>
                                <p className="text-sm text-gray-400">Ingresa los detalles técnicos.</p>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Nº de Habitación</label>
                                <input name="numero" required className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#1D9E75] outline-none font-bold" placeholder="Ej: 101" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400">Piso</label>
                                    <input name="piso" type="number" required defaultValue="1" className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#1D9E75] outline-none font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400">Capacidad (Pax)</label>
                                    <input name="capacidad" type="number" required defaultValue="1" className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#1D9E75] outline-none font-bold" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Estado Inicial</label>
                                <select name="estado" className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#1D9E75] outline-none font-bold appearance-none">
                                    <option value="LIBRE">Libre</option>
                                    <option value="OCUPADO">Ocupado</option>
                                    <option value="RESERVADO">Reservado</option>
                                    <option value="POR_LIBERARSE">Por Liberarse</option>
                                </select>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 px-6 py-4 rounded-2xl font-black text-xs text-gray-400 hover:bg-gray-100 transition-all uppercase tracking-widest"
                                >
                                    Cerrar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-[#072E1F] text-white px-6 py-4 rounded-2xl font-black text-xs shadow-xl shadow-[#072E1F]/20 hover:bg-[#0a412b] transition-all disabled:opacity-50 uppercase tracking-widest"
                                >
                                    {loading ? 'Guardando...' : 'Registrar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
