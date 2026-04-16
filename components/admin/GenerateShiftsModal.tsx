'use client'

import { useState } from 'react'
import { CalendarClock, X } from 'lucide-react'
import { generateBulkShifts } from '@/app/actions/lavanderia'
import { useRouter } from 'next/navigation'

export function GenerateShiftsModal({ lavadora }: { lavadora: any }) {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [successMsg, setSuccessMsg] = useState('')
    const [error, setError] = useState('')
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccessMsg('')
        
        const formData = new FormData(e.currentTarget)
        const horaInicio = formData.get('horaInicio') as string
        const horaFin = formData.get('horaFin') as string
        const intervaloMin = Number(formData.get('intervaloMin'))
        const dias = formData.getAll('dias') as string[]

        if (dias.length === 0) {
            setError('Selecciona al menos un día')
            setLoading(false)
            return
        }

        const data = { dias, horaInicio, horaFin, intervaloMin }
        const result = await generateBulkShifts(lavadora.id, lavadora.residenciaId, data)
        
        if (result.success) {
            setSuccessMsg(`¡${result.count} turnos generados correctamente!`)
            setTimeout(() => {
                setIsOpen(false)
                setSuccessMsg('')
            }, 2000)
            router.refresh()
        } else {
            setError(result.error || 'Error masivo')
        }
        setLoading(false)
    }

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
            >
                <CalendarClock size={16} /> Auto-Generar Turnos
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h2 className="text-xl font-black text-[#072E1F]">Cronograma de Lavado</h2>
                                <p className="text-xs text-gray-500 font-bold mt-1">Generador heurístico para {lavadora.nombre}</p>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-200 rounded-xl text-gray-400 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 uppercase text-center">{error}</div>}
                            {successMsg && <div className="p-4 bg-green-50 text-[#1D9E75] rounded-xl text-xs font-bold border border-green-100 uppercase text-center">{successMsg}</div>}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Hora Inicial del Día</label>
                                    <input type="time" name="horaInicio" defaultValue="08:00" required className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-[#1D9E75] outline-none font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Hora Límite del Día</label>
                                    <input type="time" name="horaFin" defaultValue="20:00" required className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-[#1D9E75] outline-none font-bold" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Duración por Turno</label>
                                <select name="intervaloMin" required className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-[#1D9E75] outline-none font-bold appearance-none">
                                    <option value="60">1 Hora (60 min)</option>
                                    <option value="90">1 Hora y Media (90 min)</option>
                                    <option value="120">2 Horas (120 min)</option>
                                    <option value="30">30 Minutos (Media hora)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Días a afectar</label>
                                <div className="flex flex-wrap gap-2">
                                    {['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'].map(dia => (
                                        <label key={dia} className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 hover:border-[#1D9E75] transition-colors">
                                            <input type="checkbox" name="dias" value={dia} defaultChecked className="accent-[#1D9E75] w-4 h-4 cursor-pointer" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">{dia.slice(0,3)}</span>
                                        </label>
                                    ))}
                                </div>
                                <p className="text-[10px] font-bold text-orange-400 mt-2 italic">* Se resetearán los turnos LIBRES previos de estos días para evitar duplicados.</p>
                            </div>

                            <button type="submit" disabled={loading} className="w-full bg-[#1D9E75] text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#1D9E75]/20 hover:bg-[#157a5a] transition-all disabled:opacity-50 mt-4">
                                {loading ? 'Construyendo...' : 'Generar Algoritmo'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
