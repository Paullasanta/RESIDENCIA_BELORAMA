import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { NavLink } from '@/components/shared/NavLink'
import { LogoutButton } from '@/components/shared/LogoutButton'
import { SidebarHeader } from '@/components/shared/SidebarHeader'
import {
    LayoutDashboard, Building2, Users, DollarSign,
    WashingMachine, UtensilsCrossed, ShoppingBag,
    Megaphone, Settings, Wrench, BarChart3
} from 'lucide-react'

import { MobileNavContainer } from '@/components/shared/MobileNavContainer'
import { NotificationBell } from '@/components/shared/NotificationBell'
import { SessionGuard } from '@/components/shared/SessionGuard'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await auth()

    if (!session || !session.user || !(session.user as any).id) {
        redirect('/auth/login')
    }

    const { rol, nombre, permisos } = session.user

    // Fetch dynamic branding
    const systemNameConfig = await prisma.configuracion.findUnique({ where: { clave: 'SYSTEM_NAME' } })
    const systemName = systemNameConfig?.valor || 'Belorama'

    // Permisos Helpers
    const hasPerm = (p: string) => permisos?.includes(p) || rol === 'ADMIN'

    // Configuración universal de navegación agnóstica al rol
    const navItems = [
        { href: '/modules/dashboard',     label: 'Dashboard',         icon: <LayoutDashboard size={18} />, show: true },
        { href: '/modules/residencias',   label: 'Residencias',       icon: <Building2 size={18} />,       show: hasPerm('MANAGE_RESIDENCIAS') && rol !== 'RESIDENTE' },
        { href: '/modules/residentes',    label: 'Residentes',        icon: <Users size={18} />,           show: hasPerm('MANAGE_RESIDENTES') },
        { href: '/modules/pagos',         label: 'Cobros y Pagos',    icon: <DollarSign size={18} />,      show: hasPerm('MANAGE_PAYMENTS') || rol === 'RESIDENTE' },
        { href: '/modules/lavanderia',    label: 'Lavandería',        icon: <WashingMachine size={18} />,  show: true },
        { href: '/modules/comida',        label: 'Gestión de Comidas',icon: <UtensilsCrossed size={18} />, show: true },
        { href: '/modules/marketplace',   label: 'Marketplace',       icon: <ShoppingBag size={18} />,     show: true },
        { href: '/modules/mantenimiento', label: 'Mantenimiento',     icon: <Wrench size={18} />,          show: true },
        { href: '/modules/egresos',       label: 'Gastos Residentes', icon: <DollarSign size={18} />,      show: hasPerm('MANAGE_EGRESOS') },
        { href: '/modules/reportes',      label: 'Reportes y Analítica',icon: <BarChart3 size={18} />,     show: rol === 'ADMIN' },
        { href: '/modules/avisos',        label: 'Avisos',            icon: <Megaphone size={18} />,       show: true },
        { href: '/modules/perfil',        label: 'Mi Perfil',         icon: <Users size={18} />,           show: true },
        { href: '/modules/configuracion', label: 'Configuración',     icon: <Settings size={18} />,        show: hasPerm('ADMIN_SETTINGS') || rol === 'ADMIN' },
    ]

    // Estilos dinámicos según el rol principal
    const theme = {
        ADMIN: { title: `${systemName} Admin`, logo: 'bg-[#1D9E75] text-white' },
        COCINERO: { title: 'Cocina Central', logo: 'bg-[#085041] text-white' },
        RESIDENTE: { title: 'Mi Residencia', logo: 'bg-[#EF9F27] text-black' }
    }[rol as 'ADMIN' | 'COCINERO' | 'RESIDENTE'] || { title: systemName, logo: 'bg-[#072E1F] text-white' }

    return (
        <div className="flex bg-[#F8FAF8] min-h-screen text-gray-900 font-sans">
            <SessionGuard />
            {/* Sidebar Desktop */}
            <aside className="w-72 bg-[#072E1F] text-white hidden md:flex flex-col p-6 sticky top-0 h-screen shadow-2xl z-30 shrink-0">
                <SidebarHeader 
                    title={theme.title}
                    logoStyle={theme.logo}
                    systemName="SISTEMA BELORAMA"
                    userName={nombre}
                />

                <nav className="flex-1 space-y-1.5 overflow-y-auto pr-2 -mr-2 custom-scrollbar">
                    {navItems.filter(i => i.show).map((item) => (
                        <NavLink key={item.href} href={item.href} activeColor="bg-[#1D9E75]/20 text-[#1D9E75] border-l-4 border-[#1D9E75]">
                            <span className="flex items-center gap-3 font-semibold text-sm">
                                {item.icon}
                                {item.label}
                            </span>
                        </NavLink>
                    ))}
                </nav>

                <div className="pt-6 border-t border-white/10 mt-6 space-y-4">
                    <div className="px-4">
                        <p className="text-xs font-black text-white/50 uppercase tracking-widest mb-1">Usuario</p>
                        <p className="text-sm font-bold truncate">{nombre}</p>
                    </div>
                    <LogoutButton />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative flex flex-col">
                {/* Top Bar Desktop */}
                <header className="sticky top-0 z-20 bg-[#F8FAF8]/80 backdrop-blur-md px-4 md:px-8 lg:px-12 py-4 flex items-center justify-between md:justify-end gap-4">
                    <div className="md:hidden">
                        <MobileNavContainer 
                            navItems={navItems}
                            userName={nombre}
                            theme={theme}
                        />
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <NotificationBell />
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-[10px] font-black text-[#1D9E75] uppercase tracking-widest">{rol}</span>
                            <span className="text-xs font-bold text-gray-900">{nombre}</span>
                        </div>
                    </div>
                </header>
                
                <div className="flex-1 p-4 md:p-8 lg:p-12 pt-0 md:pt-0 lg:pt-0">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    )
}

