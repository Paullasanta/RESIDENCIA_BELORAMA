'use client'

import { useState } from 'react'
import { CalendarClock, X, AlertTriangle, Lock, Unlock } from 'lucide-react'
import { generateBulkShifts } from '@/app/actions/lavanderia'
import { useRouter } from 'next/navigation'

export function GenerateShiftsModal({ lavadora, hasAssignments }: { lavadora: any, hasAssignments: boolean }) {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [successMsg, setSuccessMsg] = useState('')
    const [error, setError] = useState('')
    const [isUnlocked, setIsUnlocked] = useState(!hasAssignments)
    const router = useRouter()

    const formatIntervalo = (mins: number) => {
        if (mins === 30) return "30 Minutos (Media hora)"
        if (mins === 60) return "1 Hora (60 min)"
        if (mins === 90) return "1 Hora y Media (90 min)"
        const horas = Math.floor(mins / 60)
        const resto = mins % 60
        if (resto === 0) return `${horas} Horas (${mins} min)`
        return `${horas} Horas y ${resto} min (${mins} min)`
    }

    const [intervalo, setIntervalo] = useState(30)

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
                onClick={() => !hasAssignments && setIsOpen(true)}
                disabled={hasAssignments}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    hasAssignments 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                        : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
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
                                <div className="flex items-center w-full rounded-2xl border border-gray-100 bg-gray-50 overflow-hidden focus-within:border-[#1D9E75] focus-within:bg-white transition-colors">
                                    <div className="flex-1 px-5 py-3 font-bold text-gray-700">
                                        {formatIntervalo(intervalo)}
                                    </div>
                                    <div className="flex items-center border-l border-gray-100">
                                        <button 
                                            type="button" 
                                            onClick={() => setIntervalo(prev => Math.max(30, prev - 30))}
                                            className="px-4 py-3 hover:bg-gray-200 text-gray-400 font-bold transition-colors disabled:opacity-50"
                                            disabled={intervalo <= 30}
                                        >
                                            -
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => setIntervalo(prev => prev + 30)}
                                            className="px-4 py-3 hover:bg-[#1D9E75]/10 text-[#1D9E75] font-black transition-colors"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <input type="hidden" name="intervaloMin" value={intervalo} />
                                </div>
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

                            {hasAssignments && (
                                <div className={`p-4 rounded-2xl border transition-all duration-300 ${isUnlocked ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-0.5 p-1.5 rounded-lg ${isUnlocked ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                            {isUnlocked ? <Unlock size={14} /> : <Lock size={14} />}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${isUnlocked ? 'text-green-700' : 'text-orange-700'}`}>
                                                {isUnlocked ? 'Seguridad Desbloqueada' : 'Confirmación Requerida'}
                                            </p>
                                            <p className="text-[9px] text-gray-500 font-bold mt-0.5">
                                                Hay turnos asignados. Debes confirmar que quieres re-generar el calendario manteniendo las asignaciones.
                                            </p>
                                            <label className="flex items-center gap-2 cursor-pointer mt-3 group">
                                                <input 
                                                    type="checkbox" 
                                                    checked={isUnlocked} 
                                                    onChange={(e) => setIsUnlocked(e.target.checked)}
                                                    className="w-4 h-4 rounded border-gray-300 text-[#1D9E75] focus:ring-[#1D9E75]"
                                                />
                                                <span className="text-[10px] font-black text-gray-600 group-hover:text-[#1D9E75] transition-colors uppercase">
                                                    Sí, deseo re-generar turnos libres
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button 
                                type="submit" 
                                disabled={loading || !isUnlocked} 
                                className={`w-full px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all disabled:opacity-50 mt-4 ${
                                    isUnlocked ? 'bg-[#1D9E75] text-white shadow-[#1D9E75]/20 hover:bg-[#157a5a]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                {loading ? 'Construyendo...' : 'Generar Algoritmo'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
