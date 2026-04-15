import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { ShoppingBag } from 'lucide-react'

export default async function MarketplaceResidentePage() {
    const session = await auth()

    const productos = await prisma.productoMarketplace.findMany({
        where: { estado: 'APROBADO' },
        include: {
            residente: { include: { user: true } },
        },
        orderBy: { createdAt: 'desc' },
    })

    // Get current residente's products too
    const misProductos = await prisma.productoMarketplace.findMany({
        where: {
            residente: {
                user: { email: session!.user.email },
            },
        },
        orderBy: { createdAt: 'desc' },
        include: { residente: { include: { user: true } } },
    })

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <PageHeader
                title="Marketplace"
                description="Productos disponibles de tus compañeros de residencia."
            />

            {/* Grid de productos aprobados */}
            {productos.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <EmptyState
                        icon={<ShoppingBag size={48} />}
                        title="El marketplace está vacío"
                        description="Aún no hay productos publicados por tus compañeros."
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {productos.map(p => (
                        <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all">
                            {/* Image placeholder */}
                            <div className="h-36 bg-gradient-to-br from-[#1D9E75]/10 to-[#085041]/10 flex items-center justify-center">
                                <ShoppingBag size={36} className="text-[#1D9E75]/40" />
                            </div>
                            <div className="p-5">
                                <div className="flex items-start justify-between">
                                    <h3 className="font-bold text-gray-900 leading-tight flex-1 pr-2">{p.titulo}</h3>
                                    <span className="text-lg font-extrabold text-[#1D9E75] shrink-0">${p.precio.toLocaleString('es-MX')}</span>
                                </div>
                                {p.descripcion && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.descripcion}</p>}
                                <div className="flex items-center justify-between mt-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-[#1D9E75]/10 flex items-center justify-center text-[#1D9E75] font-bold text-xs">
                                            {p.residente.user.nombre.charAt(0)}
                                        </div>
                                        <span className="text-xs text-gray-500">{p.residente.user.nombre}</span>
                                    </div>
                                    <span className="text-xs text-gray-400">
                                        {new Date(p.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Mis publicaciones */}
            {misProductos.length > 0 && (
                <div>
                    <h2 className="text-lg font-bold text-[#072E1F] mb-4">Mis Publicaciones</h2>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/80">
                                    <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Producto</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Precio</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Estado</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Fecha</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {misProductos.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-gray-900">{p.titulo}</p>
                                            {p.descripcion && <p className="text-xs text-gray-400 truncate max-w-xs">{p.descripcion}</p>}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-[#1D9E75]">${p.precio.toLocaleString('es-MX')}</td>
                                        <td className="px-6 py-4"><StatusBadge status={p.estado as any} /></td>
                                        <td className="px-6 py-4 text-gray-500 text-xs">
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
