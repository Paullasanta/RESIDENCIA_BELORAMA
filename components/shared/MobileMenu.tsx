'use client'

import { X, User, LogOut } from 'lucide-react'
import { NavLink } from './NavLink'
import { LogoutButton } from './LogoutButton'
import { getInitials } from '@/lib/utils'

interface MobileMenuProps {
    isOpen: boolean
    onClose: () => void
    navItems: any[]
    userName: string
    theme: {
        title: string
        logo: string
    }
}

export function MobileMenu({ isOpen, onClose, navItems, userName, theme }: MobileMenuProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-[#072E1F]/60 backdrop-blur-sm animate-in fade-in duration-300" 
                onClick={onClose}
            />
            
            {/* Menu Content */}
            <div className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-[#072E1F] shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${theme.logo} rounded-xl flex items-center justify-center font-black text-sm`}>
                            {getInitials(userName)}
                        </div>
                        <div>
                            <h2 className="text-white font-black text-lg leading-none">{theme.title}</h2>
                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Menú Móvil</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-white/50 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                    {navItems.filter(i => i.show).map((item) => (
                        <div key={item.href} onClick={onClose}>
                            <NavLink href={item.href} activeColor="bg-[#1D9E75]/20 text-[#1D9E75] border-l-4 border-[#1D9E75]">
                                <span className="flex items-center gap-3 font-semibold text-sm">
                                    {item.icon}
                                    {item.label}
                                </span>
                            </NavLink>
                        </div>
                    ))}
                </nav>

                <div className="p-6 border-t border-white/10 space-y-4">
                    <div className="flex items-center gap-3 px-4 py-2">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                            <User size={16} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate">{userName}</p>
                            <p className="text-[10px] text-white/40 uppercase font-black">Sessión Activa</p>
                        </div>
                    </div>
                    <div onClick={onClose}>
                        <LogoutButton />
                    </div>
                </div>
            </div>
        </div>
    )
}
