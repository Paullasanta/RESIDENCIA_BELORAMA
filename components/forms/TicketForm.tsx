'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createTicket } from '@/app/actions/mantenimiento'
import { Button } from '@/components/ui/button'
import { Loader2, Save, AlertTriangle, Calendar } from 'lucide-react'

interface TicketFormProps {
    residencia: { id: number; nombre: string } | null
}

export function TicketForm({ residencia }: TicketFormProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(formData: FormData) {
        setError(null)
        
        try {
            const data = {
                titulo: formData.get('titulo') as string,
                descripcion: formData.get('descripcion') as string,
                prioridad: formData.get('prioridad') as 'NORMAL' | 'URGENTE' | 'IMPORTANTE',
                residenciaId: residencia?.id || 0,
                fechaInicio: formData.get('fechaInicio') as string,
                fechaFin: formData.get('fechaFin') as string
            }

            if (!data.residenciaId) {
                throw new Error('No se pudo determinar tu residencia. Contacta a soporte.')
            }

            startTransition(async () => {
                const result = await createTicket(data)
                if (result) {
                    router.push('/modules/mantenimiento')
                    router.refresh()
                }
            })
        } catch (err: any) {
            setError(err.message || 'Error al enviar la solicitud')
        }
    }

    if (!residencia) {
        return (
            <div className="p-8 bg-amber-50 border border-amber-100 rounded-[2rem] text-amber-700 space-y-4">
                <div className="flex items-center gap-3 font-black uppercase tracking-widest text-xs">
                    <AlertTriangle size={20} />
                    Atención
                </div>
                <p className="font-bold text-sm leading-relaxed">
                    No tienes una habitación asignada actualmente. Para reportar fallos técnicos, primero debes estar vinculado a una residencia activa.
                </p>
            </div>
        )
    }

    return (
        <form action={handleSubmit} className="space-y-8 bg-white p-8 md:p-12 rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/50">
            {error && (
                <div className="p-5 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in shake duration-500">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    {error}
                </div>
            )}

            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">¿Qué está fallando? (Título)</label>
                    <input
                        name="titulo"
                        required
                        className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#072E1F] focus:ring-4 focus:ring-[#072E1F]/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                        placeholder="Ej. Fuga de agua en baño / Luz fundida"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Descripción detallada</label>
                    <textarea
                        name="descripcion"
                        required
                        rows={4}
                        className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#072E1F] focus:ring-4 focus:ring-[#072E1F]/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300 resize-none"
                        placeholder="Describe el problema y su ubicación exacta..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Fecha Inicio (Estimado)</label>
                        <input
                            type="date"
                            name="fechaInicio"
                            className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#072E1F] focus:ring-4 focus:ring-[#072E1F]/5 outline-none transition-all font-bold text-gray-700"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Fecha Fin (Estimado)</label>
                        <input
                            type="date"
                            name="fechaFin"
                            className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#072E1F] focus:ring-4 focus:ring-[#072E1F]/5 outline-none transition-all font-bold text-gray-700"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Residencia</label>
                        <div className="w-full px-5 py-4 rounded-2xl border border-gray-50 bg-gray-50/50 font-black text-[#072E1F] text-sm italic">
                            {residencia.nombre}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Prioridad</label>
                        <select
                            name="prioridad"
                            required
                            className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#072E1F] focus:ring-4 focus:ring-[#072E1F]/5 outline-none transition-all font-bold text-gray-700 appearance-none cursor-pointer"
                        >
                            <option value="NORMAL">Normal</option>
                            <option value="IMPORTANTE">Importante</option>
                            <option value="URGENTE">Urgente (Bloqueante)</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end gap-4 pt-8 border-t border-gray-50">
                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full md:w-auto bg-[#072E1F] hover:bg-black text-white rounded-2xl px-12 py-4 font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-[#072E1F]/20 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                    {isPending ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <Save size={18} />
                    )}
                    Enviar Reporte
                </button>
            </div>
        </form>
    )
}
