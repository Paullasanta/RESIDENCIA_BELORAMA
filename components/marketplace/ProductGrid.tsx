'use client'

import { useState } from 'react'
import { ShoppingBag, ChevronRight } from 'lucide-react'
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
        user: {
            nombre: string
            email: string
        }
    } | null
    createdAt: Date | string
    estado: string
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

    return (
        <div className="space-y-16">
            {/* Modal de Detalle */}
            {selectedProduct && (
                <ProductDetailModal 
                    producto={selectedProduct} 
                    onClose={() => setSelectedProduct(null)} 
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
                        {aprobados.length} ARTÍCULOS
                    </span>
                </div>

                {aprobados.length === 0 ? (
                    <EmptyState
                        icon={<ShoppingBag size={64} className="text-gray-100" />}
                        title="Vaya, no hay nada por aquí..."
                        description="Vuelve más tarde o sé el primero en subir algo para vender."
                    />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                        {aprobados.map(p => (
                            <div 
                                key={p.id} 
                                onClick={() => setSelectedProduct(p)}
                                className="group bg-white rounded-[3rem] shadow-2xl shadow-gray-100/50 border border-transparent hover:border-[#1D9E75]/20 overflow-hidden hover:shadow-3xl hover:-translate-y-3 transition-all duration-700 flex flex-col cursor-pointer"
                            >
                                <div className="h-60 bg-gray-50 flex items-center justify-center relative overflow-hidden">
                                     {p.fotos.length > 0 ? (
                                         <img src={p.fotos[0]} alt={p.titulo} className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-1000" />
                                     ) : (
                                         <ShoppingBag size={48} className="text-gray-200 group-hover:rotate-12 transition-transform" />
                                     )}
                                     <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                     <div className="absolute top-6 right-6 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                         <div className="bg-white/95 backdrop-blur px-5 py-2.5 rounded-2xl text-[10px] font-black shadow-2xl uppercase tracking-[0.2em] text-[#1D9E75] border border-green-50">
                                             Ver Detalles
                                         </div>
                                     </div>
                                     <div className="absolute bottom-6 left-6">
                                         <span className="bg-white text-[#072E1F] px-6 py-3 rounded-2xl text-lg font-black shadow-2xl border border-gray-50">
                                             ${p.precio.toLocaleString('es-MX')}
                                         </span>
                                     </div>
                                </div>
                                <div className="p-10 flex flex-col flex-1">
                                    <h3 className="text-xl font-black text-[#072E1F] group-hover:text-[#1D9E75] transition-colors line-clamp-1 mb-3">
                                        {p.titulo}
                                    </h3>
                                    <p className="text-xs font-bold text-gray-400 line-clamp-2 leading-relaxed mb-8 flex-1">
                                        {p.descripcion || "Sin descripción disponible."}
                                    </p>
                                    
                                    <div className="mt-auto flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-2xl bg-green-50 text-[#1D9E75] flex items-center justify-center font-black text-[10px] border border-green-100">
                                                {p.residente?.user.nombre.charAt(0) || 'A'}
                                            </div>
                                            <span className="text-[10px] font-black text-[#072E1F] uppercase tracking-widest">{p.residente?.user.nombre.split(' ')[0] || 'Admin'}</span>
                                        </div>
                                        <ChevronRight size={20} className="text-gray-200 group-hover:text-[#1D9E75] group-hover:translate-x-1 transition-all" />
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
