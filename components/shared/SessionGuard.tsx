'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function SessionGuard() {
    const { data: session, status } = useSession()
    const pathname = usePathname()

    useEffect(() => {
        // Si estamos en una ruta protegida
        if (pathname.startsWith('/modules')) {
            // Si el status es 'authenticated' pero la sesión no tiene id 
            // (esto pasa cuando nuestro callback de session devuelve {} por usuario inactivo)
            if (status === 'authenticated' && (!session || !(session.user as any)?.id)) {
                console.warn('Sesión inválida o usuario desactivado. Cerrando sesión...')
                signOut({ callbackUrl: '/auth/login?error=AccountDisabled' })
            }
        }
    }, [session, status, pathname])

    return null
}
