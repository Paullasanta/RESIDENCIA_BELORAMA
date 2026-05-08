'use client'

import { useState } from 'react'
import { X, Users, CheckCircle2, XCircle, Clock } from 'lucide-react'

interface MealEntryProps {
    menu: any
    tipo: string
    tipoLabel: string
    tipoColorBar: string
    canManage: boolean
    residentesActivos: any[]
}

export function MealEntry({ menu, tipo, tipoLabel, tipoColorBar, canManage, residentesActivos }: MealEntryProps) {
    const [isOpen, setIsOpen] = useState(false)

    // Filtrar residentes que pertenecen a las residencias de este menú
    const mealResidenciasIds = menu.residencias.map((mr: any) => mr.residenciaId)
    const listado = residentesActivos
        .filter(r => mealResidenciasIds.includes(r.habitacion?.residenciaId))
        .map(r => {
            const asist = menu.asistencias.find((a: any) => a.residenteId === r.id)
            return {
                id: r.id,
                nombre: r.user.nombre,
                residencia: r.habitacion?.residencia.nombre || 'Sin sede',
                asiste: asist ? asist.asiste : true
            }
        })
        .sort((a, b) => a.nombre.localeCompare(b.nombre))

    const asistiendo = listado.filter(l => l.asiste)
    const noAsistiendo = listado.filter(l => !l.asiste)

    return (
        <>
            <div 
                onClick={() => setIsOpen(true)}
                className="px-5 py-3 flex flex-col gap-1 group relative transition-colors cursor-pointer hover:bg-gray-50/80"
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                        <div className={`w-1 h-10 rounded-full shrink-0 ${tipoColorBar}`} />
                        <div className="min-w-0">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{tipoLabel}</p>
                            <h4 className="font-black text-[#072E1F] text-xs leading-tight">
                                {menu.nombre}
                            </h4>
                            {menu.descripcion && (
                                <p className="text-[10px] font-medium text-gray-400 mt-1.5 leading-relaxed line-clamp-3 italic">
                                    {menu.descripcion}
                                </p>
                            )}
                        </div>
                    </div>
                    
                    {canManage && (
                        <div className="bg-[#072E1F] text-white px-3 py-2 rounded-lg font-black text-lg min-w-[50px] text-center shadow-lg shadow-[#072E1F]/20 flex flex-col items-center group-hover:scale-105 transition-transform">
                            <span>{menu.totalConfirmados}</span>
                            <span className="text-[7px] text-white/50 uppercase tracking-tighter mt-0.5">Raciones</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Detalle */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
                    <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Header */}
                        <div className="p-5 sm:p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${tipoColorBar} flex items-center justify-center text-white shadow-lg`}>
                                    <Users size={20} className="sm:w-6 sm:h-6" />
                                </div>
                                <div>
                                    <h2 className="text-base sm:text-xl font-black text-[#072E1F] leading-tight">{tipoLabel}: {menu.nombre}</h2>
                                    <p className="text-[9px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">Detalles de la Alimentación</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white rounded-xl transition-colors text-gray-400">
                                <X size={20} className="sm:w-6 sm:h-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 sm:space-y-8">
                            {canManage ? (
                                <>
                                    {/* Stats */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <div className="bg-green-50/50 border border-green-100 p-4 sm:p-6 rounded-[2rem]">
                                            <div className="flex items-center justify-between mb-1 sm:mb-2">
                                                <span className="text-[9px] sm:text-[10px] font-black text-green-600 uppercase tracking-widest">Asistirán</span>
                                                <CheckCircle2 size={16} className="text-green-500" />
                                            </div>
                                            <p className="text-2xl sm:text-3xl font-black text-green-700">{asistiendo.length}</p>
                                        </div>
                                        <div className="bg-red-50/50 border border-red-100 p-4 sm:p-6 rounded-[2rem]">
                                            <div className="flex items-center justify-between mb-1 sm:mb-2">
                                                <span className="text-[9px] sm:text-[10px] font-black text-red-600 uppercase tracking-widest">Cancelaron</span>
                                                <XCircle size={16} className="text-red-500" />
                                            </div>
                                            <p className="text-2xl sm:text-3xl font-black text-red-700">{noAsistiendo.length}</p>
                                        </div>
                                    </div>

                                    {/* List */}
                                    <div className="space-y-3 sm:space-y-4">
                                        <h3 className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Detalle por Residente</h3>
                                        <div className="grid grid-cols-1 gap-2">
                                            {listado.map((res) => (
                                                <div 
                                                    key={res.id}
                                                    className="flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gray-50/50 border border-gray-100 hover:border-gray-200 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${res.asiste ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                            {res.nombre.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-[#072E1F] text-xs sm:text-sm">{res.nombre}</p>
                                                            <p className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-tighter">{res.residencia}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`text-[8px] sm:text-[9px] font-black uppercase px-2 py-1 rounded-md ${res.asiste ? 'text-green-500 bg-green-50' : 'text-red-500 bg-red-50'}`}>
                                                        {res.asiste ? 'Asiste' : 'No Asiste'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100">
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Descripción del Menú</h3>
                                        <p className="text-[#072E1F] font-bold text-sm leading-relaxed whitespace-pre-wrap">
                                            {menu.descripcion || "No hay una descripción detallada para este menú."}
                                        </p>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                        <div className="bg-blue-500 text-white p-2 rounded-lg">
                                            <Clock size={16} />
                                        </div>
                                        <p className="text-[10px] font-black text-blue-700 uppercase tracking-tight">
                                            Recuerda confirmar o cancelar tu asistencia antes de la fecha límite.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-5 sm:p-8 bg-gray-50/50 border-t border-gray-50 flex justify-end">
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="w-full sm:w-auto bg-[#072E1F] text-white px-8 py-4 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest shadow-xl shadow-black/10 active:scale-95 transition-all"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
