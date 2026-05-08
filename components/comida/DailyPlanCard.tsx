'use client'

import { useState } from 'react'
import { Clock, X, Users, CheckCircle2, XCircle, Calendar } from 'lucide-react'
import { MealEntry } from './MealEntry'
import { AsistenciaButtons } from './AsistenciaButtons'

interface DailyPlanCardProps {
    plan: any
    canManage: boolean
    residentesActivos: any[]
    residenteId: number | null
    hoy: Date
    tipoLabel: Record<string, string>
    tipoColorBar: Record<string, string>
}

export function DailyPlanCard({ plan, canManage, residentesActivos, residenteId, hoy, tipoLabel, tipoColorBar }: DailyPlanCardProps) {
    const [isDailyModalOpen, setIsDailyModalOpen] = useState(false)
    const isLocked = plan.fechaLimite ? hoy > new Date(plan.fechaLimite) : false
    const dateObj = new Date(plan.fecha)

    // Preparar datos consolidados para el día
    const mealResidenciasIds = Array.from(new Set(plan.menus.flatMap((m: any) => m.residencias.map((mr: any) => mr.residenciaId))))
    const listadoConsolidado = residentesActivos
        .filter(r => mealResidenciasIds.includes(r.habitacion?.residenciaId))
        .map(r => {
            const getAsiste = (tipo: string) => {
                const menu = plan.menus.find((m: any) => m.tipo === tipo)
                if (!menu) return null // No hay menú programado
                const asist = menu.asistencias.find((a: any) => a.residenteId === r.id)
                return asist ? asist.asiste : true
            }
            return {
                id: r.id,
                nombre: r.user.nombre,
                residencia: r.habitacion?.residencia.nombre || 'Sin sede',
                desayuno: getAsiste('DESAYUNO'),
                almuerzo: getAsiste('ALMUERZO'),
                cena: getAsiste('CENA')
            }
        })
        .sort((a, b) => a.nombre.localeCompare(b.nombre))

    const [filterSede, setFilterSede] = useState('Todas')

    // Get unique sedes
    const sedes = ['Todas', ...Array.from(new Set(listadoConsolidado.map(l => l.residencia)))]
    
    const filteredList = listadoConsolidado.filter(l => filterSede === 'Todas' || l.residencia === filterSede)

    // Totals for summary boxes (based on filtered list)
    const totals = {
        desayuno: filteredList.filter(l => l.desayuno === true).length,
        almuerzo: filteredList.filter(l => l.almuerzo === true).length,
        cena: filteredList.filter(l => l.cena === true).length,
    }

    return (
        <>
            <div 
                className={`bg-white border border-gray-200 rounded-[1.5rem] shadow-sm flex flex-col overflow-hidden transition-all duration-300 ${canManage ? 'hover:border-[#1D9E75] hover:shadow-xl hover:shadow-[#1D9E75]/5' : ''}`}
            >
                {/* Header del Día - Clickable para Admin */}
                <div 
                    onClick={() => canManage && setIsDailyModalOpen(true)}
                    className={`p-6 pb-4 border-b border-gray-100 bg-gray-50/20 ${canManage ? 'cursor-pointer hover:bg-gray-50/50' : ''}`}
                >
                    <div className="flex items-baseline justify-between mb-1">
                        <h3 className="text-xl font-black text-[#072E1F] uppercase tracking-tighter">
                            {dateObj.toLocaleDateString('es-MX', { weekday: 'long', timeZone: 'UTC' })}
                        </h3>
                        <span className="text-sm font-black text-gray-300">
                            {dateObj.getUTCDate()}
                        </span>
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">
                        {dateObj.toLocaleDateString('es-MX', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                    </p>
                    
                    {plan.fechaLimite && (
                        <div className={`mt-4 flex items-center gap-2 text-[9px] font-bold ${isLocked ? 'text-red-400' : 'text-gray-400'}`}>
                            <Clock size={12} />
                            LIM: {new Date(plan.fechaLimite).toLocaleDateString('es-MX', { day:'2-digit', month: 'short' })} {new Date(plan.fechaLimite).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    )}
                </div>

                {/* Cuerpo de Cartilla */}
                <div className="p-0 flex-1 divide-y divide-gray-50">
                    {['DESAYUNO', 'ALMUERZO', 'CENA'].map(tipo => {
                        const menu = plan.menus.find((m: any) => m.tipo === tipo)

                        if (!menu) {
                            return (
                                <div key={tipo} className="p-5 flex items-center justify-between opacity-20 grayscale">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-1 h-6 rounded-full ${tipoColorBar[tipo]}`} />
                                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{tipoLabel[tipo]}</span>
                                    </div>
                                    <span className="text-[10px] font-bold italic text-gray-400">---</span>
                                </div>
                            )
                        }

                        const miAsistencia = menu.asistencias.find((a: any) => a.residenteId === residenteId)
                        const asiste = miAsistencia ? miAsistencia.asiste : true

                        return (
                            <div key={menu.id} className="group relative border-b border-gray-50 last:border-0">
                                <MealEntry 
                                    menu={menu}
                                    tipo={tipo}
                                    tipoLabel={tipoLabel[tipo]}
                                    tipoColorBar={tipoColorBar[tipo]}
                                    canManage={canManage}
                                    residentesActivos={residentesActivos}
                                />
                                
                                {!canManage && residenteId && (
                                    <div className="px-5 pb-5">
                                        <AsistenciaButtons 
                                            residenteId={residenteId} 
                                            menuId={menu.id} 
                                            asiste={asiste} 
                                            isLocked={isLocked}
                                            variant="cartilla"
                                        />
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Modal de Consolidado Diario */}
            {isDailyModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDailyModalOpen(false)} />
                    <div className="relative w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Header */}
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-[#072E1F] flex items-center justify-center text-white shadow-lg">
                                    <Calendar size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-[#072E1F] leading-tight capitalize">
                                        Resumen Diario: {dateObj.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })}
                                    </h2>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Consolidado de todas las comidas</p>
                                </div>
                            </div>
                            <button onClick={() => setIsDailyModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-colors text-gray-400">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-auto p-4 sm:p-8 space-y-6 sm:space-y-8">
                            {/* Table and Filter */}
                            <div className="space-y-4">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <h3 className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Detalle por Residente</h3>
                                    
                                    <div className="flex items-center gap-3">
                                        <span className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">Sede:</span>
                                        <select 
                                            value={filterSede}
                                            onChange={(e) => setFilterSede(e.target.value)}
                                            className="flex-1 sm:flex-none bg-gray-100 border-none rounded-xl px-4 py-2 text-[11px] sm:text-xs font-bold text-[#072E1F] outline-none focus:ring-2 focus:ring-[#1D9E75] transition-all cursor-pointer"
                                        >
                                            {sedes.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Desktop Table */}
                                <div className="hidden md:block border border-gray-100 rounded-[2rem] overflow-hidden bg-gray-50/30">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-100/50">
                                                <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Residente</th>
                                                <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Sede</th>
                                                <th className="px-6 py-6 text-[10px] font-black text-orange-500 uppercase tracking-widest text-center">
                                                    Desayuno
                                                    <div className="mt-1 bg-orange-100 text-orange-600 rounded-lg px-2 py-1 text-[14px] inline-block ml-2">{totals.desayuno}</div>
                                                </th>
                                                <th className="px-6 py-6 text-[10px] font-black text-blue-500 uppercase tracking-widest text-center">
                                                    Almuerzo
                                                    <div className="mt-1 bg-blue-100 text-blue-600 rounded-lg px-2 py-1 text-[14px] inline-block ml-2">{totals.almuerzo}</div>
                                                </th>
                                                <th className="px-6 py-6 text-[10px] font-black text-indigo-500 uppercase tracking-widest text-center">
                                                    Cena
                                                    <div className="mt-1 bg-indigo-100 text-indigo-600 rounded-lg px-2 py-1 text-[14px] inline-block ml-2">{totals.cena}</div>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredList.map((res) => (
                                                <tr key={res.id} className="hover:bg-white transition-colors">
                                                    <td className="px-6 py-4">
                                                        <p className="font-bold text-[#072E1F] text-sm">{res.nombre}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{res.residencia}</span>
                                                    </td>
                                                    {[res.desayuno, res.almuerzo, res.cena].map((asiste, idx) => (
                                                        <td key={idx} className="px-6 py-4 text-center">
                                                            {asiste === null ? (
                                                                <span className="text-gray-300 text-xs font-black">-</span>
                                                            ) : asiste ? (
                                                                <div className="flex justify-center"><CheckCircle2 size={18} className="text-green-500" /></div>
                                                            ) : (
                                                                <div className="flex justify-center"><XCircle size={18} className="text-red-500" /></div>
                                                            )}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile List */}
                                <div className="md:hidden space-y-3">
                                    {/* Mobile Summary Row */}
                                    <div className="grid grid-cols-3 gap-2 mb-4">
                                        <div className="bg-orange-50 p-3 rounded-2xl border border-orange-100 text-center">
                                            <p className="text-[7px] font-black text-orange-600 uppercase tracking-widest">DESAYUNO</p>
                                            <p className="text-lg font-black text-orange-700">{totals.desayuno}</p>
                                        </div>
                                        <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100 text-center">
                                            <p className="text-[7px] font-black text-blue-600 uppercase tracking-widest">ALMUERZO</p>
                                            <p className="text-lg font-black text-blue-700">{totals.almuerzo}</p>
                                        </div>
                                        <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-100 text-center">
                                            <p className="text-[7px] font-black text-indigo-600 uppercase tracking-widest">CENA</p>
                                            <p className="text-lg font-black text-indigo-700">{totals.cena}</p>
                                        </div>
                                    </div>

                                    {filteredList.map((res) => (
                                        <div key={res.id} className="bg-gray-50/50 border border-gray-100 p-3 rounded-2xl flex items-center justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <p className="font-bold text-[#072E1F] text-[11px] truncate">{res.nombre}</p>
                                                <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest">{res.residencia}</p>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0 bg-white/50 px-3 py-1.5 rounded-xl border border-gray-100">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[6px] font-black text-orange-500 uppercase leading-none mb-1">DES</span>
                                                    {res.desayuno === null ? <span className="text-gray-300 text-[10px]">-</span> : res.desayuno ? <CheckCircle2 size={14} className="text-green-500" /> : <XCircle size={14} className="text-red-500" />}
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[6px] font-black text-blue-500 uppercase leading-none mb-1">ALM</span>
                                                    {res.almuerzo === null ? <span className="text-gray-300 text-[10px]">-</span> : res.almuerzo ? <CheckCircle2 size={14} className="text-green-500" /> : <XCircle size={14} className="text-red-500" />}
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[6px] font-black text-indigo-500 uppercase leading-none mb-1">CEN</span>
                                                    {res.cena === null ? <span className="text-gray-300 text-[10px]">-</span> : res.cena ? <CheckCircle2 size={14} className="text-green-500" /> : <XCircle size={14} className="text-red-500" />}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {filteredList.length === 0 && (
                                    <div className="px-6 py-12 text-center text-gray-400 font-bold italic text-sm">
                                        No hay residentes en esta sede para mostrar.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-5 sm:p-8 bg-gray-50/50 border-t border-gray-50 flex justify-end">
                            <button 
                                onClick={() => setIsDailyModalOpen(false)}
                                className="w-full sm:w-auto bg-[#072E1F] text-white px-8 py-4 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest shadow-xl shadow-black/10 active:scale-95 transition-all"
                            >
                                Cerrar Resumen
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
