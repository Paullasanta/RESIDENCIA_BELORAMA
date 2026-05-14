'use client'

import { useState } from 'react'
import { reservarTurnoLavanderia, liberarTurnoLavanderia, aprobarTurnoSolicitado, toggleRecurringShift } from '@/app/actions/lavanderia'
import { Loader2, UserPlus, UserMinus, CheckCircle, Clock, Edit2, X, Star } from 'lucide-react'
import { toast } from 'sonner'

export function ShiftActions({ 
    turno, 
    residentes, 
    canManage,
    currentUserResidenteId,
    currentUserId,
    userTurnCount,
    userRole,
    lavadoraActiva = true
}: { 
    turno: any, 
    residentes: any[], 
    canManage: boolean,
    currentUserResidenteId?: number | null,
    currentUserId?: number | null,
    userTurnCount?: number,
    userRole?: string,
    lavadoraActiva?: boolean
}) {
    const [loading, setLoading] = useState(false)
    const [showAssign, setShowAssign] = useState(false)
    const [updatingFixed, setUpdatingFixed] = useState(false)

    // Lógica para bloquear días pasados
    const MAP_DAYS: Record<string, number> = {
        'LUNES': 1, 'MARTES': 2, 'MIERCOLES': 3, 'JUEVES': 4, 'VIERNES': 5, 'SABADO': 6, 'DOMINGO': 7,
    }
    const today = new Date().getDay()
    const todayNumeric = today === 0 ? 7 : today
    const turnoNumeric = MAP_DAYS[turno.dia] || 0
    const esDiaPasado = turnoNumeric < todayNumeric && !['ADMIN', 'SUPER_ADMIN'].includes(userRole || '')

    const esMio = turno.residenteId === currentUserResidenteId && turno.estado === 'OCUPADO'
    const esMiSolicitud = turno.residenteId === currentUserResidenteId && turno.estado === 'SOLICITADO'

    const handleAction = async (action: () => Promise<any>) => {
        setLoading(true)
        const res = await action()
        setLoading(false)
        if (res.success) {
            setShowAssign(false)
            toast.success('Operación realizada con éxito')
        } else {
            toast.error(res.error || 'Error en la operación')
        }
    }

    const handleToggleFixed = async () => {
        setUpdatingFixed(true)
        const res = await toggleRecurringShift(turno.id, !turno.esFijo)
        setUpdatingFixed(false)
        if (!res.success) {
            toast.error(res.error || 'Error al actualizar permanencia')
        } else {
            toast.success(turno.esFijo ? 'Permanencia desactivada' : 'Turno marcado como permanente')
        }
    }

    const handleLiberar = () => handleAction(() => liberarTurnoLavanderia(turno.id))
    
    const handleAsignarPropio = () => {
        if (!currentUserResidenteId) return toast.error('No se encontró perfil de residente')
        handleAction(() => reservarTurnoLavanderia(turno.id, currentUserResidenteId))
    }
    
    const handleAprobar = () => handleAction(() => aprobarTurnoSolicitado(turno.id))

    // Si es Admin, tiene vista completa de gestión
    if (canManage) {
        return (
            <div className="relative">
                {/* Backdrop to close menus on click outside */}
                {showAssign && (
                    <div 
                        className="fixed inset-0 z-40 bg-black/5 backdrop-blur-[1px]" 
                        onClick={() => {
                            setShowAssign(false)
                        }}
                    />
                )}

                <div className="flex gap-1 relative z-10">
                    <button
                        onClick={() => setShowAssign(!showAssign)}
                        disabled={loading}
                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg transition-colors text-[10px] font-bold ${
                            turno.estado === 'OCUPADO' 
                                ? 'bg-white/10 text-white hover:bg-white/20' 
                                : turno.estado === 'SOLICITADO'
                                    ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                    >
                        {loading ? <Loader2 size={12} className="animate-spin" /> : (
                            turno.estado === 'OCUPADO' ? (
                                <span className="flex items-center gap-1">
                                    <UserPlus size={12} /> 
                                    Gestionar
                                    {turno.esFijo && <Star size={10} className="fill-yellow-400 text-yellow-400 animate-pulse" />}
                                </span>
                            ) :
                            turno.estado === 'SOLICITADO' ? <><CheckCircle size={12} /> Revisar</> :
                            <><UserPlus size={12} /> Asignar</>
                        )}
                    </button>
                </div>

                {showAssign && (
                    <div className="absolute bottom-full left-0 right-0 z-50 mb-1 bg-white border border-gray-100 rounded-xl shadow-2xl p-1.5 max-h-64 overflow-y-auto min-w-[160px]">
                        <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-gray-50">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Gestión</p>
                            <button onClick={() => setShowAssign(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={10} />
                            </button>
                        </div>
                        
                        {turno.estado === 'OCUPADO' && turno.residenteId && (
                            <div className="px-2 py-2 mb-2 bg-gray-50 rounded-lg border border-gray-100">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        checked={!!turno.esFijo}
                                        onChange={handleToggleFixed}
                                        disabled={updatingFixed}
                                        className="w-3.5 h-3.5 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-gray-700 group-hover:text-yellow-600 transition-colors uppercase tracking-tight">Turno Permanente</span>
                                        <span className="text-[8px] text-gray-400 font-bold leading-tight">Se asignará solo cada semana</span>
                                    </div>
                                    {updatingFixed && <Loader2 size={10} className="animate-spin text-yellow-500 ml-auto" />}
                                </label>
                            </div>
                        )}
                        
                        {turno.estado === 'SOLICITADO' && (
                            <button
                                onClick={handleAprobar}
                                className="w-full text-left p-2 hover:bg-green-50 text-green-600 rounded-lg text-[10px] font-black truncate border-b border-gray-50 flex items-center gap-2 mb-1 transition-colors"
                            >
                                <CheckCircle size={12} /> Aprobar Solicitud
                            </button>
                        )}
                        {(turno.estado === 'OCUPADO' || turno.estado === 'SOLICITADO') && (
                            <button
                                onClick={handleLiberar}
                                className="w-full text-left p-2 hover:bg-red-50 text-red-600 rounded-lg text-[10px] font-black truncate border-b border-gray-50 flex items-center gap-2 mb-1 transition-colors"
                            >
                                <UserMinus size={12} /> {turno.estado === 'SOLICITADO' ? 'Rechazar / Liberar' : 'Liberar (Vaciar)'}
                            </button>
                        )}
                        <p className="text-[9px] font-bold text-gray-400 px-2 py-1 uppercase tracking-wider">Asignar a:</p>
                        {residentes.map(r => {
                            const isSelected = turno.residenteId === r.id;
                            const isPermanente = r.turnoStatus === 'PERMANENTE';
                            const isAsignado = r.turnoStatus === 'ASIGNADO';
                            
                            return (
                                <button
                                    key={r.id}
                                    onClick={() => handleAction(() => reservarTurnoLavanderia(turno.id, r.id))}
                                    className={`w-full text-left p-2 rounded-lg text-[10px] font-medium transition-colors mb-0.5 ${
                                        isSelected 
                                            ? 'bg-[#072E1F] text-white font-black shadow-md' 
                                            : isPermanente
                                                ? 'bg-green-400 text-green-950 font-black hover:bg-green-500 shadow-sm'
                                                : isAsignado
                                                    ? 'bg-lime-400 text-lime-950 font-black hover:bg-lime-500 shadow-sm'
                                                    : 'bg-transparent text-gray-700 font-bold hover:bg-gray-100'
                                    }`}
                                >
                                <div className="w-full truncate">
                                    {r.user.nombre} 
                                    {r.habitacion && <span className="ml-1 text-gray-500 font-bold">({r.habitacion.numero})</span>}
                                </div>
                            </button>
                            )
                        })}
                        <button
                            onClick={() => setShowAssign(false)}
                            className="w-full text-center p-2 text-[9px] font-bold text-gray-400 hover:text-gray-600 mt-1 uppercase tracking-widest border-t border-gray-50"
                        >
                            Cerrar
                        </button>
                    </div>
                )}
            </div>
        )
    }

    // Si el día ya pasó y no es admin, no mostramos acciones o mostramos un estado bloqueado
    if (esDiaPasado) {
        return (
            <div className="w-full flex items-center justify-center gap-1 py-2 bg-gray-50 text-gray-400 rounded-lg text-[9px] font-black border border-gray-100">
                <Clock size={12} /> DÍA PASADO
            </div>
        )
    }

    // Si la lavadora no está activa y no es admin, bloqueamos interacción
    if (!lavadoraActiva && !canManage) {
        return (
            <div className="w-full flex items-center justify-center gap-1 py-2 bg-gray-100 text-gray-400 rounded-lg text-[9px] font-black border border-gray-200">
                <X size={12} /> NO DISPONIBLE
            </div>
        )
    }

    // Vista para Residentes / Cocineros
    return (
        <div className="flex gap-2">
            {turno.estado === 'LIBRE' && (
                <button
                    onClick={handleAsignarPropio}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 md:py-1.5 bg-white/20 md:bg-white/20 hover:bg-white/40 text-[#072E1F] md:text-white rounded-xl md:rounded-lg transition-colors text-xs md:text-[10px] font-black border border-[#072E1F]/10 md:border-white/30 backdrop-blur-sm shadow-sm"
                >
                    {loading ? (
                        <Loader2 size={14} className="animate-spin" />
                    ) : (
                        userTurnCount === 0 
                            ? <><CheckCircle size={14} /> Tomar Turno</> 
                            : <><Clock size={14} /> Solicitar Adicional</>
                    )}
                </button>
            )}

            {esMio && (
                <button
                    onClick={handleLiberar}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 md:py-1.5 bg-red-500 text-white rounded-xl md:rounded-lg transition-colors text-xs md:text-[10px] font-black shadow-lg shadow-red-500/20"
                >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <><UserMinus size={14} /> Liberar Mi Turno</>}
                </button>
            )}

            {esMiSolicitud && (
                <button
                    onClick={handleLiberar}
                    disabled={loading || esDiaPasado}
                    className="w-full flex items-center justify-center gap-2 py-3 md:py-1.5 bg-yellow-500 text-white rounded-xl md:rounded-lg transition-colors text-xs md:text-[9px] font-black shadow-lg shadow-yellow-500/20 disabled:opacity-50"
                >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <><X size={14} /> Cancelar Solicitud</>}
                </button>
            )}
        </div>
    )
}
