'use client'

import { useState } from 'react'
import { X, ChevronLeft, ChevronRight, Mail, DollarSign, User, Calendar, ExternalLink } from 'lucide-react'
import { marcarVendido } from '@/app/actions/marketplace'

interface ProductProps {
    id: number
    titulo: string
    descripcion: string | null
    precio: number
    fotos: string[]
    residente?: {
        userId: number
        user: {
            nombre: string
            email: string
        }
    } | null
    createdAt: Date | string
}

export function ProductDetailModal({ 
    producto, 
    onClose,
    isOwner = false,
    isAdmin = false
}: { 
    producto: ProductProps, 
    onClose: () => void,
    isOwner?: boolean,
    isAdmin?: boolean
}) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [loading, setLoading] = useState(false)
    const hasMultipleImages = producto.fotos.length > 1
    
    const handleVendido = async () => {
        if (!confirm('¿Seguro que quieres marcar este producto como vendido? Ya no será visible en el Marketplace.')) return
        setLoading(true)
        const res = await marcarVendido(producto.id)
        setLoading(false)
        if (res.success) {
            onClose()
        } else {
            alert(res.error)
        }
    }

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation()
        setCurrentIndex(prev => (prev + 1) % producto.fotos.length)
    }

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation()
        setCurrentIndex(prev => (prev - 1 + producto.fotos.length) % producto.fotos.length)
    }

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center sm:p-6 md:p-10 animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-[#072E1F]/80 backdrop-blur-xl" />
            
            <div 
                className="relative w-full h-full sm:h-auto sm:max-w-5xl bg-white sm:rounded-[3rem] shadow-2xl overflow-y-auto no-scrollbar flex flex-col md:flex-row animate-in zoom-in-95 slide-in-from-bottom-10 duration-500"
                onClick={e => e.stopPropagation()}
            >
                {/* Botón Cerrar Móvil */}
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 z-10 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white md:text-gray-400 md:hover:text-gray-600 md:bg-gray-100/50 md:hover:bg-gray-100 rounded-2xl transition-all shadow-xl md:shadow-none"
                >
                    <X size={20} />
                </button>

                {/* Sección Imagen / Carrusel */}
                <div className="relative w-full md:w-3/5 aspect-square md:aspect-auto bg-gray-50 flex items-center justify-center overflow-hidden h-[300px] sm:h-[400px] md:h-auto shrink-0">
                    {producto.fotos.length > 0 ? (
                        <img 
                            src={producto.fotos[currentIndex]} 
                            alt={producto.titulo}
                            className="w-full h-full object-cover transition-all duration-700 ease-in-out"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-4 text-gray-200">
                             <ExternalLink size={80} strokeWidth={1} />
                             <span className="text-xs font-black uppercase tracking-widest text-gray-300">Sin imágenes</span>
                        </div>
                    )}

                    {hasMultipleImages && (
                        <>
                            <button 
                                onClick={prevImage}
                                className="absolute left-6 top-1/2 -translate-y-1/2 p-3 sm:p-4 rounded-2xl bg-white/20 hover:bg-white/90 backdrop-blur-md text-white hover:text-[#1D9E75] transition-all shadow-2xl border border-white/30"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button 
                                onClick={nextImage}
                                className="absolute right-6 top-1/2 -translate-y-1/2 p-3 sm:p-4 rounded-2xl bg-white/20 hover:bg-white/90 backdrop-blur-md text-white hover:text-[#1D9E75] transition-all shadow-2xl border border-white/30"
                            >
                                <ChevronRight size={20} />
                            </button>
                            <div className="absolute bottom-6 sm:bottom-10 inset-x-0 flex justify-center gap-2">
                                {producto.fotos.map((_, i) => (
                                    <div 
                                        key={i} 
                                        className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/40'}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Sección Información */}
                <div className="w-full md:w-2/5 p-6 sm:p-8 md:p-12 flex flex-col justify-between bg-white overflow-visible">
                    <div className="space-y-8">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="px-3 py-1 rounded-full bg-green-50 text-[#1D9E75] text-[10px] font-black uppercase tracking-widest border border-green-100">
                                    En Venta
                                </span>
                                <span className="text-[10px] font-bold text-gray-300 flex items-center gap-1.5 uppercase tracking-widest">
                                    <Calendar size={12} /> {new Date(producto.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                            <h2 className="text-3xl font-black text-[#072E1F] leading-tight mb-2">{producto.titulo}</h2>
                            <div className="flex items-center gap-2 text-[#1D9E75]">
                                <span className="text-3xl font-black tracking-tighter">${producto.precio.toLocaleString('es-MX')}</span>
                                <span className="text-xs font-bold uppercase tracking-widest mt-2">MXN</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Más Detalles</h3>
                            <p className="text-gray-500 leading-relaxed font-medium">
                                {producto.descripcion || "El vendedor no ha proporcionado una descripción detallada para este producto."}
                            </p>
                        </div>

                        <div className="space-y-6 pt-8 border-t border-gray-100">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Información del Vendedor</h3>
                            <div className="flex items-center gap-4 p-4 rounded-3xl bg-gray-50 border border-gray-100 transition-colors">
                                <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center font-black text-[#1D9E75] text-lg shadow-sm">
                                    {producto.residente?.user.nombre.charAt(0) || 'A'}
                                </div>
                                <div className="flex-1">
                                    <p className="font-black text-[#072E1F] leading-none mb-1">{producto.residente?.user.nombre || 'Administración'}</p>
                                    <p className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                                        <User size={12} className="text-[#1D9E75]" /> {producto.residente ? 'Residente' : 'Equipo de Grow Residencial'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 space-y-4">
                        {(isOwner || isAdmin) && (
                            <button
                                onClick={handleVendido}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-orange-500 text-white font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
                            >
                                {loading ? 'Procesando...' : 'Marcar como Vendido'}
                            </button>
                        )}
                        
                        <a 
                            href={producto.residente ? `mailto:${producto.residente.user.email}?subject=Interés en: ${producto.titulo}` : '#'}
                            className={`w-full flex items-center justify-center gap-3 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-2xl ${
                                producto.residente 
                                ? 'bg-[#072E1F] text-white hover:bg-[#0c4b33] shadow-[#072E1F]/20' 
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                            }`}
                            onClick={e => !producto.residente && e.preventDefault()}
                        >
                            <Mail size={18} />
                            Contactar Vendedor
                        </a>
                        {!producto.residente && (
                             <p className="text-[10px] text-center mt-3 font-bold text-gray-300 uppercase italic">Publicación oficial de administración</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
