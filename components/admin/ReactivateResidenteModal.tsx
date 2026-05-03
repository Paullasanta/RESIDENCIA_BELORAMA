'use client'

import { useState, useEffect, useTransition } from 'react'
import { reactivateResidente } from '@/app/actions/residentes'
import { getResidenciasConHabitaciones } from '@/app/actions/residentes'
import { X, RefreshCw, UserPlus, Home, DollarSign, Calendar, Loader2, AlertCircle } from 'lucide-react'

interface ReactivateResidenteModalProps {
    id: number
    nombre: string
    isOpen: boolean
    onClose: () => void
    defaultMontoMensual?: number
    defaultMontoGarantia?: number
}

export function ReactivateResidenteModal({ id, nombre, isOpen, onClose, defaultMontoMensual, defaultMontoGarantia }: ReactivateResidenteModalProps) {
    const [mode, setMode] = useState<'selection' | 'restore' | 'reentry'>('selection')
    const [residencias, setResidencias] = useState<any[]>([])
    const [loadingRes, setLoadingRes] = useState(false)
    const [isPending, startTransition] = useTransition()

    // Form states for reentry
    const [formData, setFormData] = useState({
        residenciaId: '',
        habitacionId: '',
        montoMensual: '',
        montoGarantia: '',
        cuotasGarantia: '1',
        diaPago: '1',
        fechaIngreso: new Date().toISOString().split('T')[0],
        fechaFinal: ''
    })

    useEffect(() => {
        if (isOpen) {
            setFormData(prev => ({
                ...prev,
                montoMensual: defaultMontoMensual?.toString() || prev.montoMensual,
                montoGarantia: defaultMontoGarantia?.toString() || prev.montoGarantia
            }))

            if (mode === 'reentry') {
                setLoadingRes(true)
                getResidenciasConHabitaciones().then(data => {
                    setResidencias(data)
                    setLoadingRes(false)
                })
            }
        }
    }, [isOpen, mode, defaultMontoMensual, defaultMontoGarantia])

    useEffect(() => {
        if (formData.fechaIngreso) {
            const day = new Date(formData.fechaIngreso).getUTCDate().toString()
            setFormData(prev => ({ ...prev, diaPago: day }))
        }
    }, [formData.fechaIngreso])

    if (!isOpen) return null

    const handleRestore = () => {
        startTransition(async () => {
            const result = await reactivateResidente(id, 'restore')
            if (result.success) {
                onClose()
            } else {
                alert('Error: ' + result.error)
            }
        })
    }

    const handleReentry = () => {
        if (!formData.residenciaId || !formData.habitacionId || !formData.montoMensual || !formData.montoGarantia || !formData.fechaIngreso || !formData.fechaFinal) {
            alert('Por favor completa TODOS los campos obligatorios, incluyendo las fechas.')
            return
        }

        startTransition(async () => {
            const result = await reactivateResidente(id, 'reentry', formData)
            if (result.success) {
                onClose()
            } else {
                alert('Error: ' + result.error)
            }
        })
    }

    const currentResidencia = residencias.find(r => r.id === parseInt(formData.residenciaId))

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#072E1F]/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
                {/* Header */}
                <div className="px-10 py-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/20">
                    <div>
                        <h2 className="text-2xl font-black text-[#072E1F] tracking-tight">Reactivar a {nombre}</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Selecciona el tipo de reactivación</p>
                    </div>
                    <button onClick={onClose} className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-10">
                    {mode === 'selection' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <button 
                                onClick={() => setMode('restore')}
                                className="group p-8 rounded-[2rem] border-2 border-gray-100 hover:border-[#1D9E75] hover:bg-green-50/50 transition-all text-left flex flex-col gap-4"
                            >
                                <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-[#1D9E75] group-hover:scale-110 transition-transform">
                                    <RefreshCw size={28} />
                                </div>
                                <div>
                                    <h3 className="font-black text-[#072E1F] text-lg leading-none mb-2">Restaurar</h3>
                                    <p className="text-xs text-gray-400 font-bold leading-relaxed">Úsalo si eliminaste por error. Mantiene toda su información y pagos actuales.</p>
                                </div>
                            </button>

                            <button 
                                onClick={() => {
                                    onClose()
                                    window.location.href = `/modules/residentes/nuevo?reintegroId=${id}`
                                }}
                                className="group p-8 rounded-[2rem] border-2 border-gray-100 hover:border-[#EF9F27] hover:bg-orange-50/50 transition-all text-left flex flex-col gap-4"
                            >
                                <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-[#EF9F27] group-hover:scale-110 transition-transform">
                                    <UserPlus size={28} />
                                </div>
                                <div>
                                    <h3 className="font-black text-[#072E1F] text-lg leading-none mb-2">Reintegración</h3>
                                    <p className="text-xs text-gray-400 font-bold leading-relaxed">Úsalo si el residente vuelve después de tiempo. Abre el formulario completo con sus datos precargados.</p>
                                </div>
                            </button>
                        </div>
                    )}

                    {mode === 'restore' && (
                        <div className="space-y-6">
                            <div className="bg-green-50 border border-green-100 p-6 rounded-2xl flex items-start gap-4">
                                <AlertCircle className="text-[#1D9E75] mt-1 shrink-0" size={20} />
                                <p className="text-xs font-bold text-green-800 leading-relaxed">
                                    Esta opción restaurará el perfil del residente tal como estaba antes de ser desactivado. 
                                    Sus pagos pendientes e historial permanecerán iguales.
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setMode('selection')} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 rounded-2xl border border-gray-100 transition-all">Cancelar</button>
                                <button 
                                    onClick={handleRestore}
                                    disabled={isPending}
                                    className="flex-1 py-4 bg-[#1D9E75] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#1D9E75]/20 hover:bg-[#167e5d] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isPending && <Loader2 size={16} className="animate-spin" />}
                                    Confirmar Restauración
                                </button>
                            </div>
                        </div>
                    )}

                    {mode === 'reentry' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Residencia</label>
                                    <div className="relative">
                                        <Home size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <select 
                                            value={formData.residenciaId}
                                            onChange={(e) => setFormData({...formData, residenciaId: e.target.value, habitacionId: ''})}
                                            required
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#EF9F27]/20"
                                        >
                                            <option value="">Seleccionar...</option>
                                            {residencias.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Habitación</label>
                                    <select 
                                        disabled={!formData.residenciaId}
                                        value={formData.habitacionId}
                                        onChange={(e) => setFormData({...formData, habitacionId: e.target.value})}
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#EF9F27]/20 disabled:opacity-50"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {currentResidencia?.habitaciones.map((h: any) => (
                                            <option key={h.id} value={h.id}>Hab {h.numero} (Piso {h.piso})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Monto Mensual</label>
                                    <div className="relative">
                                        <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input 
                                            type="number"
                                            required
                                            value={formData.montoMensual}
                                            onChange={(e) => setFormData({...formData, montoMensual: e.target.value})}
                                            placeholder="0.00"
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nueva Garantía</label>
                                    <div className="relative">
                                        <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input 
                                            type="number"
                                            required
                                            value={formData.montoGarantia}
                                            onChange={(e) => setFormData({...formData, montoGarantia: e.target.value})}
                                            placeholder="0.00"
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Fecha Ingreso</label>
                                    <div className="relative">
                                        <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input 
                                            type="date"
                                            required
                                            value={formData.fechaIngreso}
                                            onChange={(e) => setFormData({...formData, fechaIngreso: e.target.value})}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Fecha Salida</label>
                                    <div className="relative">
                                        <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input 
                                            type="date"
                                            required
                                            value={formData.fechaFinal}
                                            min={formData.fechaIngreso}
                                            onChange={(e) => setFormData({...formData, fechaFinal: e.target.value})}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => setMode('selection')} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 rounded-2xl border border-gray-100 transition-all">Regresar</button>
                                <button 
                                    onClick={handleReentry}
                                    disabled={isPending}
                                    className="flex-1 py-4 bg-[#EF9F27] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#EF9F27]/20 hover:bg-[#d88d1d] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isPending && <Loader2 size={16} className="animate-spin" />}
                                    Procesar Reintegración
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
