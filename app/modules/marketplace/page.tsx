import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { ShoppingBag, Plus } from 'lucide-react'
import { ModeracionButtons } from '@/components/admin/ModeracionButtons'

export default async function MarketplacePage() {
    const session = await auth()
    const { rol, permisos } = session!.user
    const canModerate = permisos?.includes('MARKETPLACE_APPROVE') || rol === 'ADMIN'

    const productos = await prisma.productoMarketplace.findMany({
        include: {
            residente: { include: { user: true } },
        },
        orderBy: { createdAt: 'desc' },
    })

    const pendientes = productos.filter(p => p.estado === 'PENDIENTE')
    const aprobados = productos.filter(p => p.estado === 'APROBADO')
    const misProductos = productos.filter(p => p.residente.user.email === session?.user.email)

    return (
        <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <PageHeader
                    title="Marketplace"
                    description="Portal de compra y venta entre residentes."
                />
                <button className="flex items-center gap-2 bg-[#1D9E75] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#085041] transition-all shadow-lg shadow-[#1D9E75]/20">
                    <Plus size={18} />
                    Publicar Producto
                </button>
            </div>

            {/* SECCIÓN ADMIN: Moderación */}
            {canModerate && pendientes.length > 0 && (
                <div className="bg-yellow-50/50 border border-yellow-100 rounded-[2rem] p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-2xl bg-yellow-400 text-white flex items-center justify-center shadow-lg">
                            <ShoppingBag size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[#072E1F]">Pendientes de Moderación</h2>
                            <p className="text-sm text-gray-500">Productos que requieren tu aprobación para ser visibles.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pendientes.map((p: any) => (
                            <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-yellow-200 p-6 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="font-bold text-gray-900 pr-2">{p.titulo}</h3>
                                        <span className="text-lg font-black text-[#1D9E75]">${p.precio.toLocaleString('es-MX')}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-2">Por: {p.residente.user.nombre}</p>
                                    {p.descripcion && <p className="text-xs text-gray-400 mb-4 line-clamp-2">{p.descripcion}</p>}
                                </div>
                                <ModeracionButtons id={p.id} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* SECCIÓN TODOS: Productos Disponibles */}
            <div>
                <h2 className="text-2xl font-black text-[#072E1F] mb-6 flex items-center gap-3">
                   Explorar Productos
                   <span className="text-sm font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{aprobados.length}</span>
                </h2>
                {aprobados.length === 0 ? (
                    <EmptyState
                        icon={<ShoppingBag size={48} />}
                        title="Vaya, parece que no hay nada"
                        description="Pronto verás productos publicados por tus compañeros de residencia."
                    />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {aprobados.map(p => (
                            <div key={p.id} className="group bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all">
                                <div className="h-44 bg-gray-50 flex items-center justify-center relative overflow-hidden">
                                     <ShoppingBag size={48} className="text-gray-200 group-hover:scale-110 transition-transform" />
                                     <div className="absolute top-4 right-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                                         <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold shadow-sm uppercase tracking-wider text-[#1D9E75]">
                                             Ver Detalles
                                         </span>
                                     </div>
                                </div>
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-bold text-gray-900 group-hover:text-[#1D9E75] transition-colors line-clamp-1">{p.titulo}</h3>
                                        <span className="font-black text-[#1D9E75] shrink-0">${p.precio.toLocaleString('es-MX')}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
                                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center font-bold text-[10px] text-gray-500">
                                            {p.residente.user.nombre.charAt(0)}
                                        </div>
                                        <span className="text-xs font-medium text-gray-400">{p.residente.user.nombre}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* SECCIÓN RESIDENTE: Mis Publicaciones */}
            {misProductos.length > 0 && (
                <div className="pt-10 border-t border-gray-100">
                    <h2 className="text-xl font-bold text-[#072E1F] mb-6">Mis Publicaciones</h2>
                    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50">
                                    <th className="text-left px-8 py-5 text-xs font-bold uppercase tracking-widest text-gray-400">Producto</th>
                                    <th className="text-left px-8 py-5 text-xs font-bold uppercase tracking-widest text-gray-400">Precio</th>
                                    <th className="text-left px-8 py-5 text-xs font-bold uppercase tracking-widest text-gray-400">Estado</th>
                                    <th className="text-right px-8 py-5 text-xs font-bold uppercase tracking-widest text-gray-400">Fecha</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {misProductos.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <p className="font-bold text-gray-900">{p.titulo}</p>
                                            {p.descripcion && <p className="text-xs text-gray-400 mt-0.5">{p.descripcion}</p>}
                                        </td>
                                        <td className="px-8 py-5 font-black text-[#1D9E75] tracking-tight">${p.precio.toLocaleString('es-MX')}</td>
                                        <td className="px-8 py-5">
                                            <StatusBadge status={p.estado as any} />
                                        </td>
                                        <td className="px-8 py-5 text-right text-gray-400 text-xs font-medium">
                                            {new Date(p.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
