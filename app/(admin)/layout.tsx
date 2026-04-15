import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { NavLink } from '@/components/shared/NavLink'
import {
    LayoutDashboard, Building2, Users, DollarSign,
    WashingMachine, UtensilsCrossed, ShoppingBag,
    Megaphone, Settings, LogOut
} from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await auth()

    if (!session || session.user.rol !== 'ADMIN') {
        redirect('/login')
    }

    const navItems = [
        { href: '/admin/dashboard',     label: 'Dashboard',         icon: <LayoutDashboard size={16} /> },
        { href: '/admin/residencias',   label: 'Residencias',       icon: <Building2 size={16} /> },
        { href: '/admin/residentes',    label: 'Residentes',        icon: <Users size={16} /> },
        { href: '/admin/pagos',         label: 'Cobros y Pagos',    icon: <DollarSign size={16} /> },
        { href: '/admin/lavanderia',    label: 'Lavandería',        icon: <WashingMachine size={16} /> },
        { href: '/admin/comida',        label: 'Gestión de Comidas',icon: <UtensilsCrossed size={16} /> },
        { href: '/admin/marketplace',   label: 'Marketplace',       icon: <ShoppingBag size={16} /> },
        { href: '/admin/publicaciones', label: 'Avisos',            icon: <Megaphone size={16} /> },
        { href: '/admin/configuracion', label: 'Configuración',     icon: <Settings size={16} /> },
    ]

    return (
        <div className="flex bg-[#F4F6F4] min-h-screen text-gray-900">
            <aside className="w-64 bg-[#072E1F] text-white hidden md:flex flex-col p-5 sticky top-0 h-screen shadow-xl z-20 shrink-0">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-[#1D9E75] rounded-lg flex items-center justify-center font-bold text-lg shadow-lg shadow-[#1D9E75]/30">
                        B
                    </div>
                    <span className="text-xl font-bold tracking-tight">Belorama</span>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto">
                    {navItems.map(item => (
                        <NavLink key={item.href} href={item.href} activeColor="bg-[#1D9E75]/25 text-[#1D9E75]">
                            {item.icon}
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="pt-5 border-t border-white/10 mt-2 space-y-1">
                    <p className="text-xs font-medium px-4 mb-2 opacity-60 truncate">{session.user.nombre}</p>
                    <a
                        href="/api/auth/signout"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 font-medium transition-colors text-sm"
                    >
                        <LogOut size={15} />
                        Cerrar Sesión
                    </a>
                </div>
            </aside>

            <main className="flex-1 p-6 lg:p-10 max-h-screen overflow-y-auto">
                {children}
            </main>
        </div>
    )
}
