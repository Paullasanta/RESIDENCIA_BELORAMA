'use client'

import { useState } from 'react'
import ProfileModal from './ProfileModal'
import { User } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { getInitials } from '@/lib/utils'

interface SidebarHeaderProps {
    title: string
    logoStyle: string
    systemName: string
    userName: string
}

export function SidebarHeader({ title, logoStyle, systemName, userName: initialName }: SidebarHeaderProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const { data: session } = useSession()

    const userName = session?.user?.nombre || initialName

    return (
        <>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full flex items-center gap-4 mb-10 px-2 py-3 rounded-[2rem] hover:bg-white/5 transition-all text-left group border border-transparent hover:border-white/5"
            >
                <div className={`w-12 h-12 shrink-0 ${logoStyle} rounded-2xl flex items-center justify-center font-black text-xl shadow-inner relative overflow-hidden group-hover:scale-105 transition-transform`}>
                    {getInitials(userName)}
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
