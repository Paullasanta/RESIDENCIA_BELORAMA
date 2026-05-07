'use client'

import { useState } from 'react'
import { ShoppingBag, ChevronRight, MapPin, Sparkles, Search, Sofa, Hammer, Utensils, Heart, Sparkle } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { ModeracionButtons } from '@/components/admin/ModeracionButtons'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ProductDetailModal } from './ProductDetailModal'

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
    estado: string
    categoria?: string | null
}

interface ProductGridProps {
    pendientes: ProductProps[]
    aprobados: ProductProps[]
    misProductos: ProductProps[]
    canModerate: boolean
    sessionUserEmail: string
}

export function ProductGrid({ pendientes, aprobados, misProductos, canModerate, sessionUserEmail }: ProductGridProps) {
    const [selectedProduct, setSelectedProduct] = useState<ProductProps | null>(null)
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState<string | null>(null)

    const filterFn = (p: ProductProps) => {
        const matchesSearch = p.titulo.toLowerCase().includes(search.toLowerCase()) || 
                             p.descripcion?.toLowerCase().includes(search.toLowerCase())
        const matchesCategory = !category || p.categoria === category
        return matchesSearch && matchesCategory
    }

    const filteredAprobados = aprobados.filter(filterFn)

    return (
        <div className="space-y-12">
            {/* Search and Categories UI moved here for functionality */}
            <div className="space-y-8">
                {/* Search Bar */}
                <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#1D9E75] transition-colors" size={20} />
                    <input 
                        type="text" 
                        placeholder="Buscar productos o servicios..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white border-2 border-gray-50 rounded-2xl py-5 pl-14 pr-6 text-sm font-bold focus:border-[#1D9E75] transition-all outline-none shadow-sm placeholder:text-gray-300"
                    />
                </div>

                {/* Categorías Horizontales */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-sm font-black text-[#072E1F] uppercase tracking-widest">Explorar categorías</h2>
                        <button 
                            onClick={() => setCategory(null)}
                            className={`text-[10px] font-black uppercase hover:underline ${!category ? 'text-[#1D9E75]' : 'text-gray-400'}`}
                        >
                            Ver todas
                        </button>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
                        {[
                            { label: 'Hogar', id: 'Hogar', icon: <Sofa size={22} />, color: 'bg-green-50 text-green-600' },
                            { label: 'Servicios', id: 'Servicios', icon: <Hammer size={22} />, color: 'bg-blue-50 text-blue-600' },
                            { label: 'Alimentos', id: 'Alimentos', icon: <Utensils size={22} />, color: 'bg-orange-50 text-orange-600' },
                            { label: 'Salud', id: 'Salud', icon: <Heart size={22} />, color: 'bg-rose-50 text-rose-600' },
                            { label: 'Otros', id: 'Otros', icon: <Sparkle size={22} />, color: 'bg-purple-50 text-purple-600' },
                        ].map((cat, i) => (
                            <button 
                                key={i} 
                                onClick={() => setCategory(cat.id === category ? null : cat.id)}
                                className={`flex flex-col items-center gap-2 min-w-[80px] group transition-all ${category === cat.id ? 'scale-105' : 'opacity-60 grayscale-[0.5]'}`}
                            >
                                <div className={`w-16 h-16 rounded-2xl ${cat.color} flex items-center justify-center shadow-sm group-hover:scale-110 group-active:scale-95 transition-all ${category === cat.id ? 'ring-2 ring-offset-2 ring-[#1D9E75]' : ''}`}>
                                    {cat.icon}
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-tighter ${category === cat.id ? 'text-[#1D9E75]' : 'text-gray-500'}`}>
                                    {cat.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            {/* Modal de Detalle */}
            {selectedProduct && (
                <ProductDetailModal 
                    producto={selectedProduct} 
                    onClose={() => setSelectedProduct(null)} 
                    isOwner={selectedProduct.residente?.user.email === sessionUserEmail}
                    isAdmin={canModerate}
                />
            )}

            {/* SECCIÓN ADMIN: Moderación */}
            {canModerate && pendientes.length > 0 && (
                <section className="bg-orange-50/30 border border-orange-100 rounded-[3rem] p-10 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-inner">
                            <ShoppingBag size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-[#072E1F]">Fila de Moderación</h2>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Aprobación necesaria para nuevos ingresos.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {pendientes.map((p) => (
                            <div 
                                key={p.id} 
                                onClick={() => setSelectedProduct(p)}
                                className="bg-white rounded-[2.5rem] shadow-xl shadow-orange-900/5 border border-orange-100 p-8 flex flex-col group cursor-pointer hover:shadow-2xl transition-all"
                            >
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-4">
                                        <h3 className="text-lg font-black text-[#072E1F] group-hover:text-[#1D9E75] transition-colors">{p.titulo}</h3>
                                        <span className="text-xl font-black text-[#1D9E75]">${p.precio.toLocaleString('es-MX')}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-6 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                        <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[10px]">{p.residente?.user.nombre.charAt(0) || 'A'}</div>
                                        {p.residente?.user.nombre || 'Administración'}
                                    </div>
                                </div>
                                <div onClick={e => e.stopPropagation()}>
                                    <ModeracionButtons id={p.id} />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* SECCIÓN TODOS: Explorar */}
            <section className="space-y-10">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-black text-[#072E1F] flex items-center gap-4 italic shrink-0">
                        Descubre Tesoros
                    </h2>
                    <div className="h-px bg-gray-100 flex-1 mx-8 hidden sm:block" />
                    <span className="text-[10px] font-black text-[#1D9E75] bg-green-50 px-4 py-2 rounded-2xl border border-green-100 uppercase tracking-widest shrink-0">
                        {filteredAprobados.length} ARTÍCULOS
                    </span>
                </div>

                {filteredAprobados.length === 0 ? (
                    <EmptyState
                        icon={<ShoppingBag size={64} className="text-gray-100" />}
                        title="Vaya, no hay nada por aquí..."
                        description="Vuelve más tarde o sé el primero en subir algo para vender."
                    />
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
                        {filteredAprobados.map(p => (
                            <div 
                                key={p.id} 
                                onClick={() => setSelectedProduct(p)}
                                className="group bg-white rounded-[2rem] shadow-sm border border-gray-100/50 hover:border-[#1D9E75]/30 overflow-hidden hover:shadow-xl transition-all duration-500 flex flex-col cursor-pointer"
                            >
                                <div className="aspect-square bg-gray-50 flex items-center justify-center relative overflow-hidden">
                                     {p.fotos.length > 0 ? (
                                         <img src={p.fotos[0]} alt={p.titulo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                     ) : (
                                         <ShoppingBag size={32} className="text-gray-200" />
                                     )}
                                     <div className="absolute top-3 left-3">
                                         <span className="bg-white/90 backdrop-blur text-[#072E1F] px-3 py-1.5 rounded-xl text-xs font-black shadow-sm border border-white/20">
                                             ${p.precio.toLocaleString('es-MX')}
                                         </span>
                                     </div>
                                </div>
                                <div className="p-4 flex flex-col flex-1 space-y-1">
                                    <h3 className="text-xs font-black text-[#072E1F] group-hover:text-[#1D9E75] transition-colors line-clamp-1 uppercase tracking-tight">
                                        {p.titulo}
                                    </h3>
                                    <div className="flex items-center gap-1.5">
                                        <MapPin size={10} className="text-gray-300" />
                                        <span className="text-[9px] font-bold text-gray-400 truncate">
                                            {p.residente?.user.nombre || 'Administración'}
                                        </span>
                                    </div>
                                    <div className="pt-2 flex items-center justify-between">
                                        <div className="flex items-center gap-1">
                                            <Sparkles size={10} className="text-amber-400 fill-amber-400" />
                                            <span className="text-[9px] font-black text-[#1D9E75]">NUEVO</span>
                                        </div>
                                        <ChevronRight size={14} className="text-gray-200 group-hover:text-[#1D9E75] group-hover:translate-x-0.5 transition-all" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* SECCIÓN USUARIO: Mis Publicaciones */}
            {misProductos.length > 0 && (
                <section className="pt-20 border-t border-gray-100">
                    <h2 className="text-2xl font-black text-[#072E1F] mb-10">Tus Publicaciones</h2>
                    <div className="bg-white rounded-[3rem] shadow-2xl shadow-gray-200/40 border border-gray-100 overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="text-left px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Producto</th>
                                    <th className="text-center px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Estado</th>
                                    <th className="text-right px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Precio</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {misProductos.map(p => (
                                    <tr 
                                        key={p.id} 
                                        onClick={() => setSelectedProduct(p)}
                                        className="hover:bg-green-50/20 transition-all group cursor-pointer"
                                    >
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 rounded-2xl bg-gray-50 overflow-hidden shrink-0 border border-gray-100">
                                                    {p.fotos.length > 0 ? (
                                                        <img src={p.fotos[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-200">
                                                            <ShoppingBag size={24} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-black text-[#072E1F] text-lg mb-1">{p.titulo}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">{new Date(p.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'long' })}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <StatusBadge status={p.estado as any} />
                                        </td>
                                        <td className="px-10 py-8 text-right font-black text-2xl text-[#1D9E75] tracking-tighter">
                                            ${p.precio.toLocaleString('es-MX')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </div>
    )
}
