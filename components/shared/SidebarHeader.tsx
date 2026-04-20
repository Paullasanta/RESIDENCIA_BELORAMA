'use client'

import { useState } from 'react'
import ProfileModal from './ProfileModal'
import { User } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface SidebarHeaderProps {
    title: string
    logoStyle: string
    systemName: string
    userImage?: string | null
    userName: string
}

export function SidebarHeader({ title, logoStyle, systemName, userImage: initialImage, userName: initialName }: SidebarHeaderProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const { data: session } = useSession()

    // Usar datos de la sesión para reactividad inmediata, o los iniciales si no hay sesión aún
    const userImage = session?.user?.imagen || initialImage
    const userName = session?.user?.nombre || initialName

    return (
        <>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full flex items-center gap-4 mb-10 px-2 py-3 rounded-[2rem] hover:bg-white/5 transition-all text-left group border border-transparent hover:border-white/5"
            >
                <div className={`w-12 h-12 shrink-0 ${logoStyle} rounded-2xl flex items-center justify-center font-black text-xl shadow-inner relative overflow-hidden group-hover:scale-105 transition-transform`}>
                    {userImage ? (
                        <img src={userImage} alt={userName} className="w-full h-full object-cover" />
                    ) : (
                        userName.charAt(0).toUpperCase()
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
                        <div className="opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all">
                            <User size={16} className="text-white" />
                        </div>
                    </div>
                </div>
                <div className="flex flex-col min-w-0">
                    <h2 className="text-lg font-black tracking-tight leading-tight truncate group-hover:text-[#1D9E75] transition-colors">{title}</h2>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-0.5 truncate">{systemName}</p>
                </div>
            </button>

            <ProfileModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
            />
        </>
    )
}
