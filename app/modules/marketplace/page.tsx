import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Search, MapPin, Sparkles, Sofa, Hammer, Utensils, Heart, ShoppingBag, Plus } from 'lucide-react'
import Link from 'next/link'
import { ProductGrid } from '@/components/marketplace/ProductGrid'

export default async function MarketplacePage() {
    const session = await auth()
    const { rol, permisos, residenciaId } = session!.user
    const canModerate = permisos?.includes('MARKETPLACE_APPROVE') || ['ADMIN', 'SUPER_ADMIN'].includes(rol)

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
        <div className="space-y-8 pb-10 animate-in fade-in duration-700">
            {/* Header Estilo App Premium */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-[#072E1F] tracking-tighter leading-none mb-1">¡Hola, vecino!</h1>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">¿Qué necesitas hoy?</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-[#1D9E75]">
                        <ShoppingBag size={24} />
                    </div>
                </div>

                {/* Banner de Acción */}
                <div className="bg-[#072E1F] rounded-3xl p-6 text-white relative overflow-hidden shadow-2xl shadow-green-900/20 group">
                    <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform duration-1000">
                        <ShoppingBag size={180} />
                    </div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="max-w-[180px]">
                            <h3 className="text-lg font-black leading-tight mb-2 uppercase">Ofrece lo que sabes hacer</h3>
                            <p className="text-[10px] font-medium opacity-70 uppercase tracking-widest">Llega a toda la red de residentes.</p>
                        </div>
                        <Link
                            href="/modules/marketplace/nuevo"
                            className="bg-[#1D9E75] hover:bg-white hover:text-[#072E1F] p-4 rounded-2xl transition-all shadow-xl flex items-center gap-2 font-black text-xs uppercase"
                        >
                            <Plus size={20} />
                            Publicar ahora
                        </Link>
                    </div>
                </div>
            </div>

            <ProductGrid 
                pendientes={pendientes as any}
                aprobados={aprobados as any}
                misProductos={misProductos as any}
                canModerate={canModerate}
                sessionUserEmail={session!.user.email!}
            />
        </div>
    )
}
