'use client'

import { useState } from 'react'
import { X, Calendar, User, CreditCard, Mail, Phone, FileText } from 'lucide-react'
import { createReserva } from '@/app/actions/reservas'
import { useRouter } from 'next/navigation'

export function ReservaModal({ habitacion, onClose }: { habitacion: any, onClose: () => void }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const data = Object.fromEntries(formData.entries())
        
        const res = await createReserva({
            ...data,
            habitacionId: habitacion.id
        })

        if (res.success) {
            router.refresh()
            onClose()
        } else {
            setError(res.error || 'Error al crear la reserva')
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4">
                
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-[#1D9E75]/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#1D9E75] text-white flex items-center justify-center shadow-lg shadow-[#1D9E75]/20">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[#072E1F]">Nueva Reserva</h2>
                            <p className="text-[10px] font-black text-[#1D9E75] uppercase tracking-widest">Habitación {habitacion.numero}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-2xl animate-in shake">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Datos Personales */}
                        <div className="md:col-span-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Nombre Completo</label>
                             <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                <input name="nombre" placeholder="Nombres" required className="w-full pl-12 pr-5 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-[#1D9E75] outline-none font-bold" />
                             </div>
                        </div>

                        <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Apellido Paterno</label>
                             <input name="apellidoPaterno" required className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-[#1D9E75] outline-none font-bold" />
                        </div>

                        <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Apellido Materno</label>
                             <input name="apellidoMaterno" className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-[#1D9E75] outline-none font-bold" />
                        </div>

                        <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">DNI / Documento</label>
                             <div className="relative">
                                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                <input name="dni" required className="w-full pl-12 pr-5 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-[#1D9E75] outline-none font-bold" />
                             </div>
                        </div>

                        <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Fecha de Ingreso</label>
                             <input name="fechaIngreso" type="date" required className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-[#1D9E75] outline-none font-bold" />
                        </div>

                        <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Monto Mensual</label>
                             <input name="montoMensual" type="number" step="0.01" defaultValue={habitacion.montoMensual || 0} className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-[#1D9E75] outline-none font-bold" />
                        </div>

                        <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Garantía Total</label>
                             <input name="montoGarantia" type="number" step="0.01" defaultValue={habitacion.montoGarantia || 0} className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-[#1D9E75] outline-none font-bold" />
                        </div>

                        <div className="md:col-span-2 space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Correo Electrónico</label>
                             <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                <input name="email" type="email" className="w-full pl-12 pr-5 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-[#1D9E75] outline-none font-bold" />
                             </div>
                        </div>

                        <div className="md:col-span-2 space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Teléfono</label>
                             <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                <input name="telefono" className="w-full pl-12 pr-5 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-[#1D9E75] outline-none font-bold" />
                             </div>
                        </div>

                        <div className="md:col-span-2 space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Notas Adicionales</label>
                             <div className="relative">
                                <FileText className="absolute left-4 top-4 text-gray-300" size={18} />
                                <textarea name="notas" rows={3} className="w-full pl-12 pr-5 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-[#1D9E75] outline-none font-bold resize-none"></textarea>
                             </div>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading} 
                        className="w-full bg-[#1D9E75] text-white py-4 rounded-[1.5rem] font-black text-sm shadow-xl shadow-[#1D9E75]/20 hover:bg-[#167d5c] transition-all disabled:opacity-50 uppercase tracking-widest mt-4"
                    >
                        {loading ? 'Procesando Reserva...' : 'Confirmar Registro de Reserva'}
                    </button>
                </form>
            </div>
        </div>
    )
}
