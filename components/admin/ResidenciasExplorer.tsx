'use client'

import { useState, useEffect } from 'react'
import { Building2, ChevronRight, DoorOpen, User, Calendar, Clock, Lock } from 'lucide-react'
import { ManageHabitacionModal } from './ManageHabitacionModal'
import { checkHabitacionesStatus } from '@/app/actions/habitaciones'

interface ResidenciasExplorerProps {
    residencias: any[]
}

export function ResidenciasExplorer({ residencias }: ResidenciasExplorerProps) {
    const [selectedResidencia, setSelectedResidencia] = useState<any | null>(null)
    const [viewMode, setViewMode] = useState<'SEDES' | 'HABITACIONES'>('SEDES')

    useEffect(() => {
        // Al cargar, ejecutamos el chequeo dinámico de estados
        checkHabitacionesStatus()
    }, [])

    const handleDoubleClick = (res: any) => {
        setSelectedResidencia(res)
        setViewMode('HABITACIONES')
    }

    if (viewMode === 'HABITACIONES' && selectedResidencia) {
        return (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setViewMode('SEDES')}
                        className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors"
                    >
                        <ChevronRight className="rotate-180" size={24} />
                    </button>
                    <div>
                        <h3 className="text-xl font-black text-[#072E1F]">{selectedResidencia.nombre}</h3>
                        <p className="text-[10px] font-black text-[#1D9E75] uppercase tracking-widest">Explorador de Habitaciones</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {selectedResidencia.habitaciones.map((hab: any) => {
                        const isOcupada = hab.estado === 'OCUPADO'
                        const isReservada = hab.estado === 'RESERVADO'
                        const isPorLiberar = hab.estado === 'POR_LIBERARSE'
                        const residente = hab.residentes[0]

                        return (
                            <div key={hab.id} className={`group bg-white rounded-[2rem] border transition-all hover:shadow-xl p-6 flex flex-col justify-between ${
                                isOcupada ? 'border-blue-100 shadow-blue-50' :
                                isReservada ? 'border-orange-100 shadow-orange-50' :
                                isPorLiberar ? 'border-red-100 shadow-red-50' :
                                'border-gray-100 shadow-gray-50'
                            }`}>
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                                            isOcupada ? 'bg-blue-50 text-blue-600' :
                                            isReservada ? 'bg-orange-50 text-orange-600' :
                                            isPorLiberar ? 'bg-red-50 text-red-600' :
                                            'bg-gray-50 text-gray-400'
                                        }`}>
                                            <DoorOpen size={20} />
                                        </div>
                                        <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${
                                            isOcupada ? 'bg-blue-50 text-blue-600' :
                                            isReservada ? 'bg-orange-50 text-orange-600' :
                                            isPorLiberar ? 'bg-red-50 text-red-600' :
                                            'bg-gray-50 text-gray-400'
                                        }`}>
                                            {hab.estado.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <h4 className="text-lg font-black text-gray-900 leading-tight mb-1">Hab. {hab.numero}</h4>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Piso {hab.piso} • Cap. {hab.capacidad}</p>

                                    {residente && (
                                        <div className="bg-gray-50/50 rounded-2xl p-3 border border-gray-100 mb-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <User size={12} className="text-[#1D9E75]" />
                                                <span className="text-[10px] font-black text-gray-800 uppercase line-clamp-1">{residente.user.nombre}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar size={12} className="text-gray-400" />
                                                <span className="text-[9px] font-bold text-gray-500">
                                                    Salida: {residente.fechaFinal ? new Date(residente.fechaFinal).toLocaleDateString() : 'Indefinida'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                    <ManageHabitacionModal habitacion={hab} />
                                    {isOcupada && <Lock size={14} className="text-gray-300" />}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
            {residencias.map(res => (
                <div 
                    key={res.id}
                    onDoubleClick={() => handleDoubleClick(res)}
                    className="group relative bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-gray-50 hover:shadow-2xl hover:border-[#1D9E75]/30 transition-all cursor-pointer overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#1D9E75]/5 rounded-bl-full -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
                    
                    <div className="flex items-center gap-4 mb-6 relative">
                        <div className="w-12 h-12 rounded-[1.25rem] bg-[#072E1F] text-[#1D9E75] flex items-center justify-center shadow-lg shadow-[#072E1F]/20">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-[#072E1F] leading-tight">{res.nombre}</h3>
                            <p className="text-xs font-bold text-gray-400">{res.direccion}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 relative">
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Habitaciones</p>
                            <p className="text-xl font-black text-[#072E1F]">{res.habitaciones.length}</p>
                        </div>
                        <div className="bg-[#1D9E75]/10 rounded-2xl p-4 border border-[#1D9E75]/10">
                            <p className="text-[9px] font-black text-[#1D9E75] uppercase tracking-widest mb-1">Libres</p>
                            <p className="text-xl font-black text-[#072E1F]">
                                {res.habitaciones.filter((h: any) => h.estado === 'LIBRE').length}
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between text-gray-400 group-hover:text-[#1D9E75] transition-colors">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Doble clic para explorar</span>
                        <ChevronRight size={18} />
                    </div>
                </div>
            ))}
        </div>
    )
}
