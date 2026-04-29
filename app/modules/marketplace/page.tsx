import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { ShoppingBag, Plus } from 'lucide-react'
import Link from 'next/link'
import { ModeracionButtons } from '@/components/admin/ModeracionButtons'
import { ProductGrid } from '@/components/marketplace/ProductGrid'

export default async function MarketplacePage() {
    const session = await auth()
    const { rol, permisos, residenciaId } = session!.user
    const canModerate = permisos?.includes('MARKETPLACE_APPROVE') || rol === 'ADMIN'

    const productos = await prisma.productoMarketplace.findMany({
        where: {},
        include: {
            residente: { include: { user: true } },
        },
        orderBy: { createdAt: 'desc' },
    })

    const pendientes = productos.filter(p => p.estado === 'PENDIENTE')
    const aprobados = productos.filter(p => p.estado === 'APROBADO')
    const misProductos = productos.filter(p => p.residente?.user.email === session?.user.email)

    return (
        <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <PageHeader
                    title="Marketplace"
                    description="Portal de compra y venta entre residentes."
                />
                <Link
                    href="/modules/marketplace/nuevo"
                    className="flex items-center gap-2 bg-[#1D9E75] text-white px-8 py-4 rounded-2xl font-black hover:bg-[#085041] transition-all shadow-xl shadow-[#1D9E75]/20"
                >
                    <Plus size={18} />
                    Publicar Producto
                </Link>
            </div>

            <ProductGrid 
                pendientes={pendientes as any}
                aprobados={aprobados as any}
                misProductos={misProductos as any}
                canModerate={canModerate}
                sessionUserEmail={session.user.email!}
            />
        </div>
    )
}
