'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { MobileMenu } from './MobileMenu'

interface MobileNavContainerProps {
    navItems: any[]
    userName: string
    theme: {
        title: string
        logo: string
    }
}

export function MobileNavContainer({ navItems, userName, theme }: MobileNavContainerProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    return (
        <div className="md:hidden">
            <header className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${theme.logo} rounded-xl flex items-center justify-center font-black text-sm`}>
                        {theme.title.charAt(0)}
                    </div>
                    <h1 className="font-black text-gray-900">{theme.title}</h1>
                </div>
                
                <button 
                    onClick={() => setIsMenuOpen(true)}
                    className="p-2 bg-white border border-gray-100 rounded-xl shadow-sm text-[#072E1F] hover:bg-gray-50 transition-colors"
                >
                    <Menu size={20} />
                </button>
            </header>

            <MobileMenu 
                isOpen={isMenuOpen} 
                onClose={() => setIsMenuOpen(false)} 
                navItems={navItems}
                userName={userName}
                theme={theme}
            />
        </div>
    )
}
