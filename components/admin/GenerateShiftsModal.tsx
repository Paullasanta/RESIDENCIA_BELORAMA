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
            setSuccessMsg(`¡${(result as any).count || ''} turnos generados correctamente!`)
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
                className={`flex items-center gap-2 px-4 h-10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${
                    hasAssignments 
                        ? 'bg-gray-100/50 text-gray-400 cursor-not-allowed border border-gray-200 shadow-none' 
                        : 'bg-[#1D9E75] text-white hover:bg-[#157a5a] shadow-[#1D9E75]/30 active:scale-95'
                }`}
            >
                <CalendarClock size={16} />
                <span className="hidden sm:inline">Auto-Generar</span>
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
                    <div className="bg-white h-full sm:h-auto sm:rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-y-auto no-scrollbar animate-in zoom-in-95 slide-in-from-bottom-10">
                        <div className="sticky top-0 z-10 px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md">
                            <div>
                                <h2 className="text-xl font-black text-[#072E1F]">Cronograma</h2>
                                <p className="text-[10px] text-[#1D9E75] font-black uppercase tracking-widest">Generador para {lavadora.nombre}</p>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl text-gray-400 transition-all active:scale-90">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
                            {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-[10px] font-black border border-red-100 uppercase text-center">{error}</div>}
                            {successMsg && <div className="p-4 bg-green-50 text-[#1D9E75] rounded-xl text-[10px] font-black border border-green-100 uppercase text-center">{successMsg}</div>}

                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Hora Inicio</label>
                                    <input type="time" name="horaInicio" defaultValue="08:00" required className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-[#1D9E75] outline-none font-bold text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Hora Límite</label>
                                    <input type="time" name="horaFin" defaultValue="20:00" required className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-[#1D9E75] outline-none font-bold text-sm" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Duración del Turno</label>
                                <div className="flex items-center w-full rounded-2xl border border-gray-100 bg-gray-50 overflow-hidden focus-within:border-[#1D9E75] focus-within:bg-white transition-colors">
                                    <div className="flex-1 px-4 py-3 font-bold text-gray-700 text-sm">
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

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Días a afectar</label>
                                <div className="grid grid-cols-4 gap-1.5">
                                    {['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'].map(dia => (
                                        <label key={dia} className="flex flex-col items-center gap-1.5 cursor-pointer bg-gray-50 p-2 rounded-xl border border-gray-100 has-[:checked]:border-[#1D9E75] has-[:checked]:bg-[#1D9E75]/5 transition-all active:scale-95">
                                            <input type="checkbox" name="dias" value={dia} defaultChecked className="accent-[#1D9E75] w-3.5 h-3.5 cursor-pointer" />
                                            <span className="text-[8px] font-black uppercase tracking-tight text-gray-400 peer-checked:text-[#1D9E75]">{dia.slice(0,3)}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {hasAssignments && (
                                <div className={`p-4 rounded-2xl border transition-all duration-300 ${isUnlocked ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'}`}>
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-0.5 p-1.5 rounded-lg ${isUnlocked ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                            {isUnlocked ? <Unlock size={14} /> : <Lock size={14} />}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${isUnlocked ? 'text-green-700' : 'text-orange-700'}`}>
                                                {isUnlocked ? 'Confirmado' : 'Seguridad'}
                                            </p>
                                            <label className="flex items-center gap-2 cursor-pointer mt-2 group">
                                                <input 
                                                    type="checkbox" 
                                                    checked={isUnlocked} 
                                                    onChange={(e) => setIsUnlocked(e.target.checked)}
                                                    className="w-4 h-4 rounded border-gray-300 text-[#1D9E75] focus:ring-[#1D9E75]"
                                                />
                                                <span className="text-[9px] font-bold text-gray-500 group-hover:text-[#1D9E75] transition-colors leading-tight">
                                                    Deseo re-generar el calendario
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button 
                                type="submit" 
                                disabled={loading || !isUnlocked} 
                                className={`w-full px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all active:scale-95 disabled:opacity-50 ${
                                    isUnlocked ? 'bg-[#1D9E75] text-white shadow-[#1D9E75]/30 hover:bg-[#157a5a]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
