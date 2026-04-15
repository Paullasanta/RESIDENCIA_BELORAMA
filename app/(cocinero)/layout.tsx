import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { NavLink } from '@/components/shared/NavLink'
import { UtensilsCrossed, WashingMachine, LogOut } from 'lucide-react'

export default async function CocineroLayout({ children }: { children: React.ReactNode }) {
    const session = await auth()

    if (!session || session.user.rol !== 'COCINERO') {
        redirect('/login')
    }

    const navItems = [
        { href: '/cocinero/comida',     label: 'Publicar Comidas',      icon: <UtensilsCrossed size={16} /> },
        { href: '/cocinero/lavanderia', label: 'Lavandería (Personal)',  icon: <WashingMachine size={16} /> },
    ]

    return (
        <div className="flex bg-[#F4F6F4] min-h-screen text-gray-900">
            <aside className="w-64 bg-[#085041] text-white hidden md:flex flex-col p-5 sticky top-0 h-screen shadow-xl z-20 shrink-0">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-bold text-lg text-[#085041]">
                        B
                    </div>
                    <span className="text-xl font-bold tracking-tight">Cocina Central</span>
                </div>

                <nav className="flex-1 space-y-1">
                    {navItems.map(item => (
                        <NavLink key={item.href} href={item.href} activeColor="bg-white/20 text-white">
                            {item.icon}
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="pt-5 border-t border-white/20 mt-2 space-y-1">
                    <p className="text-xs font-medium px-4 mb-2 opacity-60 truncate">{session.user.nombre}</p>
                    <a
                        href="/api/auth/signout"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/20 text-red-100 hover:bg-red-500/40 font-medium transition-colors text-sm"
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
