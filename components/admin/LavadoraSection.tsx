'use client'

import { useState } from 'react'
import { WashingMachine, Clock, TableProperties, LayoutGrid } from 'lucide-react'
import { GenerateShiftsModal } from './GenerateShiftsModal'
import { ShiftActions } from './ShiftActions'
import { LaundryExportActions } from './LaundryExportActions'

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

    // Extract unique time slots for this washing machine
    const allTurnos = days.flatMap(d => d.turnos)
    const uniqueTimes = Array.from(new Set(allTurnos.map(t => `${t.horaInicio}|${t.horaFin}`))).sort()

    // Filter residents by the residence of the washing machine
    const residentesFiltrados = residentes.filter(r => r.user.residenciaId === lavadora.residenciaId)

    return (
        <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
            {/* Cabecera */}
            <div className="px-8 py-6 bg-gradient-to-r from-[#072E1F] to-[#154a34] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white backdrop-blur-md">
                        <WashingMachine size={24} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-black text-white">{lavadora.nombre}</h3>
                            <span className="text-[10px] bg-white/20 text-white/80 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                {lavadora.residencia.nombre}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`w-2 h-2 rounded-full ${lavadora.activa ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></span>
                            <p className="text-white/60 text-xs font-bold uppercase tracking-widest">
                                {lavadora.activa ? 'Operativa' : 'Fuera de Servicio'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => setViewMode(v => v === 'cards' ? 'table' : 'cards')}
                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all font-bold text-xs tracking-wider border border-white/20"
                    >
                        {viewMode === 'cards' ? (
                            <><TableProperties size={16} /> VISTA TABLA</>
                        ) : (
                            <><LayoutGrid size={16} /> VISTA CUADRÍCULA</>
                        )}
                    </button>
                    {canManage && (
                        <div className="flex gap-2">
                            <LaundryExportActions lavadora={lavadora} days={days} />
                            <div className="flex bg-white/10 p-1.5 border border-white/20 rounded-xl">
                                <GenerateShiftsModal lavadora={lavadora} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Contenido */}
            {viewMode === 'cards' ? (
                // --- VISTA CUADRÍCULA (Cards) ---
                <div className="grid grid-cols-1 md:grid-cols-8 divide-x divide-gray-50 bg-gray-50/30">
                    {/* Columna de Horarios (Solo Desktop) */}
                    <div className="hidden md:flex flex-col min-h-[200px] bg-white z-10 shadow-sm border-r border-gray-100">
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

                    {days.map(({ dia, turnos: turnosDia }) => (
                        <div key={dia} className="min-h-[200px] flex flex-col">
                            <div className="px-2 py-3 bg-white border-b border-gray-50 text-center flex flex-col justify-center h-[56px]">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#1D9E75] mb-0.5">{DIA_LABEL[dia].slice(0, 3)}</p>
                                <p className="text-[10px] font-bold text-gray-400">{DIA_LABEL[dia]}</p>
                            </div>
                            <div className="p-2 space-y-2 flex-1">
                                {turnosDia.length === 0 ? (
                                    <div className="h-full flex items-center justify-center py-10 opacity-20">
                                        <Clock size={16} className="text-gray-400 rotate-12" />
                                    </div>
                                ) : turnosDia.map((t: any) => {
                                    const esMio = t.residente?.user?.email === session?.user.email
                                    return (
                                        <div key={t.id} className={`group relative rounded-xl p-2 transition-all duration-300 border h-[84px] flex flex-col justify-between ${
                                            esMio ? 'bg-[#EF9F27] border-transparent shadow shadow-[#EF9F27]/20' :
                                            t.estado === 'LIBRE' 
                                                ? 'bg-white border-gray-100 hover:border-[#1D9E75] hover:shadow hover:shadow-[#1D9E75]/5' 
                                                : t.estado === 'SOLICITADO'
                                                    ? 'bg-yellow-50 border-yellow-200'
                                                    : 'bg-[#072E1F] border-transparent shadow-sm'
                                        }`}>
                                            <div className="flex items-start justify-between mb-0.5 gap-1">
                                                <div className={`flex flex-col md:hidden ${t.estado === 'LIBRE' ? 'text-[#1D9E75]' : 'text-white/70'}`}>
                                                    <span className="text-[9px] font-black tracking-tight flex items-center gap-1">
                                                        <Clock size={8} /> {t.horaInicio}
                                                    </span>
                                                    <span className="text-[8px] font-bold opacity-80 pl-2">
                                                        hasta {t.horaFin}
                                                    </span>
                                                </div>
                                                {esMio && (
                                                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-sm whitespace-nowrap md:ml-auto bg-white text-[#EF9F27]">
                                                        Mío
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div className="flex-1 flex items-center">
                                                {t.residente ? (
                                                    <p className="text-[10px] font-bold text-white truncate w-full leading-tight">
                                                        {t.residente.user.nombre}
                                                    </p>
                                                ) : (
                                                    <p className="text-[10px] font-medium text-gray-400 italic w-full leading-tight">Disponible</p>
                                                )}
                                            </div>

                                            <div className="mt-auto relative z-10">
                                                <ShiftActions 
                                                    turno={t} 
                                                    residentes={residentesFiltrados} 
                                                    canManage={canManage} 
                                                    currentUserResidenteId={currentUserResidenteId}
                                                    currentUserId={currentUserId}
                                                    userTurnCount={userTurnCount}
                                                    userRole={session?.user.rol}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
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

                                                return (
                                                    <td key={d.dia} className={`p-2 border border-gray-300 text-xs font-medium transition-colors ${
                                                        isLibre ? 'bg-[#fff5cc] text-gray-800' : 
                                                        esMio ? 'bg-[#EF9F27] text-white font-bold' :
                                                        'bg-[#fce4ec] text-gray-900'
                                                    }`}>
                                                        {isLibre ? 'Administración' : turno.residente?.user?.nombre}
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
