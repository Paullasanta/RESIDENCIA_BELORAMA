'use client'

import { useState } from 'react'
import { Calendar, MapPin, Trash2, Megaphone, AlertTriangle, Bell, ChevronLeft, ChevronRight, User } from 'lucide-react'
import { deleteAviso } from '@/app/actions/avisos'
import { Reactions } from './Reactions'

const PRIORIDAD_CONFIG: Record<string, { label: string, color: string, icon: any, glow: string }> = {
    URGENTE: { 
        label: 'Urgente', 
        color: 'bg-red-500 text-white border-red-400', 
        icon: <AlertTriangle size={16} />,
        glow: 'ring-4 ring-red-500/20 border-red-500 shadow-xl shadow-red-500/10 animate-pulse'
    },
    IMPORTANTE: { 
        label: 'Importante', 
        color: 'bg-orange-100 text-orange-600 border-orange-200', 
        icon: <Bell size={16} />,
        glow: 'border-orange-300 shadow-lg shadow-orange-500/5'
    },
    NORMAL: { 
        label: 'Normal', 
        color: 'bg-green-50 text-green-600 border-green-100', 
        icon: <Megaphone size={16} />,
        glow: 'border-gray-100'
    },
}

export function AvisoFeed({ avisos, isAdmin, currentUserEmail }: { avisos: any[], isAdmin: boolean, currentUserEmail: string }) {
    return (
        <div className="flex flex-col items-center gap-12 max-w-2xl mx-auto w-full">
            {avisos.map((aviso) => (
                <article 
                    key={aviso.id} 
                    className={`w-full bg-white rounded-[3rem] overflow-hidden transition-all duration-500 border ${PRIORIDAD_CONFIG[aviso.prioridad].glow}`}
                >
                    {/* Header estilo Social Media */}
                    <div className="p-8 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#072E1F] text-white flex items-center justify-center font-black text-lg shadow-lg">
                                {aviso.autor.nombre.charAt(0)}
                            </div>
                            <div>
                                <p className="font-black text-[#072E1F] leading-none mb-1">{aviso.autor.nombre}</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                                        {new Date(aviso.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                                    </span>
                                    <span className="w-1 h-1 bg-gray-200 rounded-full" />
                                    <span className="text-[10px] font-black text-[#1D9E75] uppercase tracking-widest leading-none flex items-center gap-1">
                                        <MapPin size={10} /> {aviso.residencia?.nombre || 'Global'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className={`px-4 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${PRIORIDAD_CONFIG[aviso.prioridad].color}`}>
                            {PRIORIDAD_CONFIG[aviso.prioridad].icon}
                            {PRIORIDAD_CONFIG[aviso.prioridad].label}
                        </div>
                    </div>

                    {/* Contenido Visual (Imágenes) */}
                    {aviso.fotos && aviso.fotos.length > 0 && (
                        <div className="relative group aspect-video bg-gray-50 flex items-center justify-center overflow-hidden border-y border-gray-50">
                            <img 
                                src={aviso.fotos[0]} 
                                alt={aviso.titulo} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
                            />
                            {aviso.fotos.length > 1 && (
                                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black text-white uppercase tracking-widest border border-white/20">
                                    + {aviso.fotos.length - 1} imágenes
                                </div>
                            )}
                        </div>
                    )}

                    {/* Texto del Comunicado */}
                    <div className="p-10 space-y-6">
                        <div>
                            {(aviso.fechaInicio || aviso.fechaFin) && (
                                <div className="flex items-center gap-3 mb-6 p-4 rounded-[1.5rem] bg-blue-50/30 border border-blue-100/50 w-fit">
                                    <Calendar size={14} className="text-blue-500" />
                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                                        {aviso.fechaInicio ? new Date(aviso.fechaInicio).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) : 'Hoy'} 
                                        {' ➔ '}
                                        {aviso.fechaFin ? new Date(aviso.fechaFin).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) : 'Indefinido'}
                                    </span>
                                </div>
                            )}
                            <h3 className="text-2xl font-black text-[#072E1F] mb-4 leading-tight">{aviso.titulo}</h3>
                            <p className="text-gray-500 font-medium leading-relaxed whitespace-pre-wrap">
                                {aviso.contenido}
                            </p>
                        </div>

                        {/* Interacciones (Corazón / Leído) */}
                        <div className="pt-8 border-t border-gray-50 flex items-center justify-between">
                            <Reactions 
                                avisoId={aviso.id} 
                                reacciones={aviso.reacciones} 
                                currentUserEmail={currentUserEmail} 
                            />

                            {isAdmin && (
                                <button 
                                    onClick={async () => {
                                        if (confirm('¿Eliminar este comunicado?')) {
                                            await deleteAviso(aviso.id)
                                        }
                                    }}
                                    className="p-3 rounded-2xl bg-gray-50 text-red-300 hover:text-red-500 hover:bg-red-50 border border-gray-100 transition-all"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                </article>
            ))}
        </div>
    )
}
