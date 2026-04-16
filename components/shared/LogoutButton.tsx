'use client'

import { signOut } from 'next-auth/react'
import { LogOut, Loader2 } from 'lucide-react'
import { useState } from 'react'

export function LogoutButton() {
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    const handleLogout = async () => {
        setIsLoggingOut(true)
        await signOut({ callbackUrl: '/auth/login', redirect: true })
    }

    return (
        <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 font-medium transition-colors text-sm disabled:opacity-50"
        >
            {isLoggingOut ? (
                <Loader2 size={15} className="animate-spin" />
            ) : (
                <LogOut size={15} />
            )}
            {isLoggingOut ? 'Cerrando...' : 'Cerrar Sesión'}
        </button>
    )
}
