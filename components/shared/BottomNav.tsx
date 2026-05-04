'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, WashingMachine, UtensilsCrossed, ShoppingBag, User, MoreHorizontal, X, LogOut } from 'lucide-react'
import { useState } from 'react'
import { signOut } from 'next-auth/react'

export function BottomNav({ navItems: allItems }: { navItems: any[] }) {
    const pathname = usePathname()
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    // Accesos rápidos (Los 4 más usados)
    const quickItems = [
        { href: '/modules/dashboard',   label: 'Home',    icon: <LayoutDashboard size={20} /> },
        { href: '/modules/lavanderia',  label: 'Lavado',  icon: <WashingMachine size={20} /> },
        { href: '/modules/marketplace', label: 'Market',  icon: <ShoppingBag size={20} /> },
        { href: '/modules/perfil',      label: 'Perfil',  icon: <User size={20} /> },
    ]

    return (
        <>
            {/* Panel de Menú Completo (Se abre al pulsar 'Más') */}
            {isMenuOpen && (
                <div className="fixed inset-0 bg-[#072E1F]/95 backdrop-blur-xl z-[60] animate-in fade-in slide-in-from-bottom-10 duration-500 p-8 flex flex-col">
                    <div className="flex justify-between items-center mb-10 shrink-0">
                        <div className="flex flex-col">
                            <h2 className="text-2xl font-black text-white tracking-tighter leading-none">Módulos</h2>
                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">Acceso Completo</p>
                        </div>
                        <button 
                            onClick={() => setIsMenuOpen(false)} 
                            className="p-4 bg-white/10 text-white rounded-[1.5rem] hover:bg-white/20 transition-all active:scale-95"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    
                    <div className="flex-1 grid grid-cols-2 gap-4 overflow-y-auto pb-10 no-scrollbar">
                        {allItems.filter(i => i.show).map((item) => {
                            const isCurrent = pathname === item.href
                            return (
                                <Link 
                                    key={item.href} 
                                    href={item.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`flex flex-col items-center justify-center gap-3 p-6 rounded-[2.5rem] border transition-all active:scale-95 ${
                                        isCurrent 
                                            ? 'bg-[#1D9E75] border-[#1D9E75] text-white shadow-lg shadow-[#1D9E75]/20' 
                                            : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                    }`}
                                >
                                    <div className={`${isCurrent ? 'scale-110' : ''} transition-transform`}>
                                        {item.icon}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-center">{item.label}</span>
                                </Link>
                            )
                        })}

                        {/* Botón de Cerrar Sesión Especial */}
                        <button 
                            onClick={() => signOut()}
                            className="col-span-2 flex items-center justify-center gap-3 p-6 rounded-[2.5rem] bg-red-500/10 border border-red-500/20 text-red-500 transition-all active:scale-95 mt-4"
                        >
                            <LogOut size={20} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Cerrar Sesión</span>
                        </button>
                    </div>
                </div>
            )}

            <nav className="md:hidden fixed bottom-8 left-8 right-8 bg-[#072E1F]/90 backdrop-blur-xl border border-white/10 px-6 py-3 flex items-center justify-between z-50 shadow-2xl rounded-[2.5rem]">
                {quickItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link 
                            key={item.href} 
                            href={item.href}
                            className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                                isActive ? 'text-[#1D9E75] scale-110' : 'text-white/40'
                            }`}
                        >
                            <div className={`relative transition-all ${isActive ? 'text-[#1D9E75]' : ''}`}>
                                {item.icon}
                                {isActive && (
                                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-[#1D9E75] rounded-full animate-ping"></span>
                                )}
                            </div>
                        </Link>
                    )
                })}
                
                {/* Botón de Menú Expandido */}
                <button 
                    onClick={() => setIsMenuOpen(true)}
                    className="flex flex-col items-center gap-1 transition-all duration-300 text-white/40 hover:text-white active:scale-110"
                >
                    <MoreHorizontal size={22} />
                </button>
            </nav>
        </>
    )
}
