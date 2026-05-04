'use client'

import { useState } from 'react'
import { WashingMachine, Clock, TableProperties, LayoutGrid, UserPlus } from 'lucide-react'
import { GenerateShiftsModal } from './GenerateShiftsModal'
import { ShiftActions } from './ShiftActions'
import { ClearShiftsButton } from './ClearShiftsButton'

const DIA_LABEL: Record<string, string> = {
    LUNES: 'Lunes', MARTES: 'Martes', MIERCOLES: 'Miércoles', 
    JUEVES: 'Jueves', VIERNES: 'Viernes', SABADO: 'Sábado', DOMINGO: 'Domingo',
}

export function LavadoraSection({ 
    lavadora, 
    days, 
    session, 
    residentes, 
    canManage,
    currentUserResidenteId,
    currentUserId,
    userTurnCount
}: { 
    lavadora: any, 
    days: any[], 
    session: any, 
    residentes: any[], 
    canManage: boolean,
    currentUserResidenteId?: number | null,
    currentUserId?: number | null,
    userTurnCount?: number
}) {
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
    const [selectedDayMobile, setSelectedDayMobile] = useState(days[0]?.dia || 'LUNES')

    // Extract unique time slots for this washing machine
    const allTurnos = days.flatMap(d => d.turnos)
    const uniqueTimes = Array.from(new Set(allTurnos.map(t => `${t.horaInicio.trim()}|${t.horaFin.trim()}`))).sort()

    // Filter residents by the residence of the washing machine
    const residentesFiltrados = residentes.filter(r => r.user.residenciaId === lavadora.residenciaId)

    return (
        <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-visible">
            {/* Cabecera */}
            <div className="px-6 py-5 bg-gradient-to-r from-[#072E1F] to-[#154a34] flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-t-[2rem]">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white backdrop-blur-md">
                        <WashingMachine size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-black text-white">{lavadora.nombre}</h3>
                            <span className="text-[9px] bg-white/20 text-white/80 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                {lavadora.residencia.nombre}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => setViewMode(v => v === 'cards' ? 'table' : 'cards')}
                        className="flex items-center justify-center w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all border border-white/10 backdrop-blur-md"
                        title={viewMode === 'cards' ? 'Vista Tabla' : 'Vista Cards'}
                    >
                        {viewMode === 'cards' ? <TableProperties size={20} /> : <LayoutGrid size={20} />}
                    </button>
                    
                    {canManage && (
                        <div className="flex gap-2">
                            <GenerateShiftsModal 
                                lavadora={lavadora} 
                                hasAssignments={allTurnos.some(t => t.estado !== 'LIBRE')}
                            />
                            <ClearShiftsButton 
                                lavadoraId={lavadora.id} 
                                residenciaId={lavadora.residenciaId}
                                hasAssignments={allTurnos.some(t => t.estado !== 'LIBRE')}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Selector de Días MÓVIL - Rediseño App-First */}
            <div className="md:hidden bg-white/80 backdrop-blur-md sticky top-0 z-30 px-4 py-3 border-b border-gray-100 flex gap-2 overflow-x-auto no-scrollbar">
                {days.map(({ dia }) => (
                    <button
                        key={dia}
                        onClick={() => setSelectedDayMobile(dia)}
                        className={`flex-shrink-0 px-5 py-2.5 rounded-2xl text-[11px] font-black transition-all duration-300 ${
                            selectedDayMobile === dia 
                                ? 'bg-[#1D9E75] text-white shadow-lg shadow-[#1D9E75]/30 scale-105' 
                                : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                        }`}
                    >
                        {DIA_LABEL[dia].toUpperCase()}
                    </button>
                ))}
            </div>

            {viewMode === 'cards' || true ? ( // Forzamos cards en móvil indirectamente
                <>
                    {/* --- VISTA MÓVIL (Timeline Vertical Premium) --- */}
                    <div className="md:hidden flex flex-col bg-[#F8FAFC] p-4 gap-4 pb-24">
                        {days.find(d => d.dia === selectedDayMobile)?.turnos.length === 0 ? (
                            <div className="py-20 text-center opacity-30 flex flex-col items-center gap-4">
                                <Clock size={48} className="text-gray-300" />
                                <p className="font-bold text-gray-400">No hay turnos disponibles</p>
                            </div>
                        ) : (
                            days.find(d => d.dia === selectedDayMobile)?.turnos.map((t: any) => {
                                const esMio = t.residente?.user?.email === session?.user.email
                                const isLibre = t.estado === 'LIBRE'
                                
                                return (
                                    <div key={t.id} className={`relative bg-white rounded-[2rem] p-5 shadow-sm border transition-all duration-300 ${
                                        esMio ? 'border-[#1D9E75] ring-2 ring-[#1D9E75]/10 bg-white' :
                                        isLibre ? 'border-gray-50' : 'border-gray-100 bg-gray-50/30'
                                    }`}>
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                                                    esMio ? 'bg-[#1D9E75] text-white' :
                                                    isLibre ? 'bg-[#1D9E75]/10 text-[#1D9E75]' : 'bg-gray-200 text-gray-500'
                                                }`}>
                                                    <Clock size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-lg font-black text-[#072E1F] leading-tight">{t.horaInicio} – {t.horaFin}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Turno de Lavado</p>
                                                </div>
                                            </div>
                                            
                                            {esMio && (
                                                <span className="bg-[#1D9E75] text-white text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-tighter animate-pulse">
                                                    Mi Turno
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 mb-4">
                                            {t.residente ? (
                                                <div className="flex items-center gap-3 w-full">
                                                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-sm font-black text-[#1D9E75] border border-gray-100">
                                                        {t.residente.user.nombre.charAt(0)}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-xs font-black text-gray-900 leading-none mb-1">{t.residente.user.nombre}</p>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                                                                t.tipoReserva === 'BASE' ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-[#1D9E75]'
                                                            }`}>
                                                                {t.tipoReserva === 'BASE' ? 'TITULAR' : t.tipoReserva}
                                                            </span>
                                                            {t.duenioBase && t.residente.user.nombre !== t.duenioBase && (
                                                                <span className="text-[7px] font-bold text-orange-500 uppercase tracking-widest">TEMPORAL</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3 opacity-60">
                                                    <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                                                        <UserPlus size={16} className="text-gray-300" />
                                                    </div>
                                                    <p className="text-xs font-bold text-gray-400 italic">Espacio libre para reservar</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-2">
                                            <ShiftActions 
                                                turno={t} 
                                                residentes={residentesFiltrados} 
                                                canManage={canManage} 
                                                currentUserResidenteId={currentUserResidenteId}
                                                currentUserId={currentUserId}
                                                userTurnCount={userTurnCount}
                                                userRole={session?.user.rol}
                                                lavadoraActiva={lavadora.activa}
                                            />
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>

                    {/* --- VISTA CUADRÍCULA (Solo Desktop) --- */}
                    <div className="hidden md:grid grid-cols-8 divide-x divide-gray-50 bg-gray-50/30">
                        {/* Columna de Horarios */}
                        <div className="flex flex-col min-h-[200px] bg-white z-10 shadow-sm border-r border-gray-100">
                            <div className="px-2 py-3 bg-white border-b border-gray-50 text-center flex flex-col justify-center h-[56px]">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#1D9E75] mb-0.5">HORARIO</p>
                                <p className="text-[10px] font-bold text-gray-400">Turno</p>
                            </div>
                            <div className="p-2 space-y-2 flex-1">
                                {uniqueTimes.map(time => {
                                    const [inicio, fin] = time.split('|')
                                    return (
                                        <div key={time} className="flex flex-col items-center justify-center rounded-xl p-2 border border-gray-100 bg-gray-50/50 h-[84px]">
                                            <span className="text-xs font-black text-[#072E1F]">{inicio}</span>
                                            <div className="w-3 h-px bg-gray-300 my-0.5"></div>
                                            <span className="text-xs font-black text-[#072E1F]">{fin}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        {/* ... rest of the grid ... */}
                        {days.map(({ dia, turnos: turnosDia }) => (
                            <div key={dia} className="min-h-[200px] flex flex-col">
                                <div className="px-2 py-3 bg-white border-b border-gray-50 text-center flex flex-col justify-center h-[56px]">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#1D9E75] mb-0.5">{DIA_LABEL[dia].slice(0, 3)}</p>
                                    <p className="text-[10px] font-bold text-gray-400">{DIA_LABEL[dia]}</p>
                                </div>
                                <div className="p-2 space-y-2 flex-1">
                                    {turnosDia.map((t: any) => {
                                        const esMio = t.residente?.user?.email === session?.user.email
                                        return (
                                            <div key={t.id} className={`group relative rounded-xl p-2 transition-all duration-300 border-2 h-[84px] flex flex-col justify-between ${
                                                esMio ? 'bg-[#EF9F27] border-[#EF9F27] shadow shadow-[#EF9F27]/20' :
                                                t.estado === 'LIBRE' 
                                                    ? 'bg-white border-gray-100 hover:border-[#1D9E75]/50' 
                                                    : t.estado === 'SOLICITADO'
                                                        ? 'bg-yellow-50 border-yellow-200'
                                                        : 'bg-[#072E1F] border-[#072E1F] shadow-sm'
                                            } ${t.duenioBase ? 'ring-1 ring-[#1D9E75]/20' : ''}`}>
                                                {t.duenioBase && (
                                                    <div className={`absolute -top-2 -left-1 px-1.5 py-0.5 rounded-full text-[6px] font-black uppercase tracking-widest z-20 shadow-sm border ${
                                                        t.residente?.user.nombre === t.duenioBase ? 'bg-[#1D9E75] text-white border-[#1D9E75]' : 'bg-white text-[#1D9E75] border-[#1D9E75]'
                                                    }`}>
                                                        ⚓ Base: {t.duenioBase}
                                                    </div>
                                                )}
                                                <div className="flex items-start justify-between mb-0.5 gap-1">
                                                    {esMio && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-sm whitespace-nowrap md:ml-auto bg-white text-[#EF9F27] z-10">MI TURNO</span>}
                                                </div>
                                                <div className="flex-1 flex flex-col justify-center">
                                                    {t.residente ? (
                                                        <>
                                                            <p className="text-[10px] font-bold text-white truncate w-full leading-tight z-10">{t.residente.user.nombre}</p>
                                                            <div className="flex items-center gap-1 mt-0.5 z-10">
                                                                <span className={`text-[7px] font-black uppercase tracking-tighter px-1 rounded-sm ${t.tipoReserva === 'BASE' ? 'bg-white/20 text-white/70' : t.tipoReserva === 'EXTRA' ? 'bg-green-500 text-white' : 'bg-yellow-400 text-yellow-900'}`}>
                                                                    {t.tipoReserva === 'BASE' ? 'TITULAR' : t.tipoReserva}
                                                                </span>
                                                                {t.duenioBase && t.residente.user.nombre !== t.duenioBase && <span className="text-[6px] font-black text-orange-300 uppercase tracking-widest animate-pulse">TEMPORAL</span>}
                                                            </div>
                                                        </>
                                                    ) : <p className="text-[10px] font-medium text-gray-400 italic w-full leading-tight">Disponible</p>}
                                                </div>
                                                <div className="mt-auto relative z-10">
                                                    <ShiftActions turno={t} residentes={residentesFiltrados} canManage={canManage} currentUserResidenteId={currentUserResidenteId} currentUserId={currentUserId} userTurnCount={userTurnCount} userRole={session?.user.rol} lavadoraActiva={lavadora.activa} />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                // --- VISTA TABLA (Excel Style) ---
                <div className="overflow-x-auto bg-gray-50/50 p-6">
                    <div className="min-w-[800px] border-2 border-[#072E1F] rounded-lg overflow-hidden bg-white shadow-sm">
                        <table className="w-full text-center border-collapse">
                            <thead>
                                <tr>
                                    <th className="bg-[#072E1F] text-white p-3 border border-[#072E1F] font-black text-xs uppercase tracking-wider w-32">
                                        HORARIO
                                    </th>
                                    {days.map(d => (
                                        <th key={d.dia} className="bg-[#072E1F] text-white p-3 border border-[#072E1F] font-black text-xs uppercase tracking-wider">
                                            {DIA_LABEL[d.dia]}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {uniqueTimes.map(time => {
                                    const [inicio, fin] = time.split('|')
                                    return (
                                        <tr key={time}>
                                            <td className="bg-sky-50 text-gray-800 p-2 border border-gray-300 font-bold text-xs whitespace-nowrap">
                                                De {inicio} a {fin}
                                            </td>
                                            {days.map(d => {
                                                const turno = d.turnos.find((t: any) => t.horaInicio === inicio && t.horaFin === fin)
                                                
                                                if (!turno) {
                                                    return <td key={d.dia} className="p-2 border border-gray-300 bg-gray-50 text-gray-400 text-xs">-</td>
                                                }

                                                const isLibre = turno.estado === 'LIBRE'
                                                const esMio = turno.residente?.user?.email === session?.user.email
                                                const duenioBase = (turno as any).duenioBase

                                                return (
                                                    <td key={d.dia} className={`p-2 border border-gray-300 text-[10px] font-medium transition-colors ${
                                                        isLibre ? 'bg-[#fff5cc] text-gray-800' : 
                                                        esMio ? 'bg-[#EF9F27] text-white font-bold' :
                                                        'bg-[#fce4ec] text-gray-900'
                                                    }`}>
                                                        <div className="flex flex-col">
                                                            <span>{isLibre ? 'Disponible' : turno.residente?.user?.nombre}</span>
                                                            {duenioBase && (
                                                                <span className={`text-[7px] uppercase font-black mt-0.5 ${
                                                                    isLibre ? 'text-gray-400' : 
                                                                    esMio ? 'text-white/60' : 'text-gray-400'
                                                                }`}>
                                                                    {isLibre ? `(Fijo: ${duenioBase})` : (turno.residente?.user.nombre !== duenioBase ? `Ex: ${duenioBase}` : 'Base')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    )
                                })}
                                {uniqueTimes.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-gray-400 font-medium italic border border-gray-300">
                                            No hay turnos registrados
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
