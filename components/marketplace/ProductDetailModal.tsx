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
            telefono: string | null
        }
    } | null
    createdAt: Date | string
    telefonoContacto?: string | null
    whatsappContacto?: string | null
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
            className="fixed inset-0 z-[100] w-screen h-screen flex items-center justify-center animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div className="fixed inset-0 bg-[#072E1F]/80 backdrop-blur-xl" />
            
            <div 
                className="relative w-full h-full sm:h-[90vh] sm:max-w-5xl bg-white sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 slide-in-from-bottom-10 duration-500"
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
                <div className="relative w-full md:w-3/5 aspect-square md:aspect-auto bg-gray-50 flex items-center justify-center overflow-hidden h-[300px] sm:h-[400px] md:h-full shrink-0">
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
                <div className="w-full md:w-2/5 p-6 sm:p-8 md:p-10 flex flex-col justify-between bg-white overflow-y-auto no-scrollbar">
                    <div className="space-y-6">
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
                                <span className="text-3xl font-black tracking-tighter">S/ {producto.precio.toLocaleString('es-PE')}</span>
                                <span className="text-xs font-bold uppercase tracking-widest mt-2">SOLES</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Más Detalles</h3>
                            <p className="text-gray-500 leading-relaxed font-medium">
                                {producto.descripcion || "Sin descripción."}
                            </p>
                        </div>

                        <div className="space-y-2 pt-6 border-t border-gray-100">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Vendedor</h3>
                            <div>
                                <p className="font-black text-[#072E1F] text-sm uppercase tracking-tight">{producto.residente?.user.nombre || 'Administración'}</p>
                                <p className="text-[10px] font-bold text-[#1D9E75] uppercase tracking-widest mt-0.5">
                                    {producto.residente ? 'Residente Belorama' : 'Equipo de Grow Residencial'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 space-y-4">
                        {(isOwner || isAdmin) && (
                            <button
                                onClick={handleVendido}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-orange-500 text-white font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
                            >
                                {loading ? 'Procesando...' : 'Marcar como Vendido'}
                            </button>
                        )}
                        
                        {!isOwner && (
                            <div className="space-y-3">
                                {producto.whatsappContacto && (
                                    <a 
                                        href={`https://wa.me/${producto.whatsappContacto.replace(/\s/g, '').replace('+', '')}`}
                                        target="_blank"
                                        className="w-full flex items-center justify-center gap-3 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] bg-[#1D9E75] text-white hover:bg-[#167e5d] transition-all shadow-xl shadow-green-900/20"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.432h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                        </svg>
                                        WhatsApp
                                    </a>
                                )}
                                {producto.telefonoContacto && (
                                    <a 
                                        href={`tel:${producto.telefonoContacto.replace(/\s/g, '')}`}
                                        className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-[#072E1F] border-2 border-gray-100 hover:bg-gray-50 transition-all"
                                    >
                                        Llamar: {producto.telefonoContacto}
                                    </a>
                                )}
                                {!producto.whatsappContacto && !producto.telefonoContacto && producto.residente && (
                                    <a 
                                        href={`mailto:${producto.residente.user.email}?subject=Interés en: ${producto.titulo}`}
                                        className="w-full flex items-center justify-center gap-3 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] bg-[#072E1F] text-white hover:bg-[#0c4b33] shadow-xl shadow-[#072E1F]/20 transition-all"
                                    >
                                        <Mail size={18} />
                                        Contactar por Email
                                    </a>
                                )}
                            </div>
                        )}
                        {!producto.residente && (
                             <p className="text-[10px] text-center mt-3 font-bold text-gray-300 uppercase italic">Publicación oficial de administración</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
