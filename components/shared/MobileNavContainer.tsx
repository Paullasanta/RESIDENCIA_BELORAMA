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
            <button 
                onClick={() => setIsMenuOpen(true)}
                className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm text-[#072E1F] hover:bg-gray-50 transition-all text-gray-400 hover:text-[#1D9E75]"
            >
                <Menu size={20} />
            </button>

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
