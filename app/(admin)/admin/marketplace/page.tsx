import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { ShoppingBag } from 'lucide-react'

export default async function MarketplacePage() {
    const productos = await prisma.productoMarketplace.findMany({
        include: {
            residente: { include: { user: true } },
        },
        orderBy: { createdAt: 'desc' },
    })

    const pendientes = productos.filter(p => p.estado === 'PENDIENTE')
    const resto = productos.filter(p => p.estado !== 'PENDIENTE')

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <PageHeader
                title="Marketplace"
                description="Modera los productos publicados por los residentes."
            />

            {/* Pendientes de aprobación */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-lg font-bold text-[#072E1F]">Pendientes de Aprobación</h2>
                    {pendientes.length > 0 && (
                        <span className="bg-[#EF9F27] text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendientes.length}</span>
                    )}
                </div>
                {pendientes.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <EmptyState
                            icon={<ShoppingBag size={36} />}
                            title="Todo al día"
                            description="No hay productos pendientes de aprobación."
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pendientes.map(p => (
                            <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-yellow-200 p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-900 leading-tight">{p.titulo}</h3>
                                        <p className="text-sm text-gray-500 mt-1">{p.residente.user.nombre}</p>
                                    </div>
                                    <span className="text-lg font-extrabold text-[#1D9E75]">${p.precio.toLocaleString('es-MX')}</span>
                                </div>
                                {p.descripcion && <p className="text-xs text-gray-500 mb-4">{p.descripcion}</p>}
                                <div className="flex gap-2">
                                    <span className="flex-1 text-center py-2 rounded-xl bg-green-50 text-green-700 font-semibold text-xs border border-green-200 cursor-pointer hover:bg-green-100 transition-colors">
                                        ✓ Aprobar
                                    </span>
                                    <span className="flex-1 text-center py-2 rounded-xl bg-red-50 text-red-600 font-semibold text-xs border border-red-200 cursor-pointer hover:bg-red-100 transition-colors">
                                        ✕ Rechazar
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Resto de productos */}
            {resto.length > 0 && (
                <div>
                    <h2 className="text-lg font-bold text-[#072E1F] mb-4">Todos los Productos</h2>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/80">
                                    <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Producto</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Publicado por</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Precio</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Estado</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Fecha</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {resto.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-gray-900">{p.titulo}</p>
                                            {p.descripcion && <p className="text-xs text-gray-400 truncate max-w-xs">{p.descripcion}</p>}
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">{p.residente.user.nombre}</td>
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
