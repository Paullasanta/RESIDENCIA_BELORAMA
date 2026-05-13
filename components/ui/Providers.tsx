'use client'

import { SessionProvider, useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

function SessionGuard({ children }: { children: React.ReactNode }) {
    const { status } = useSession()
    const pathname = usePathname()
    const router = useRouter()

    useEffect(() => {
        // Redirigir inmediatamente al login si la sesión expira o es invalidada (ej. cuando pasa a inactivo)
        // Solo protegemos las rutas de módulos (/modules), las demás son públicas (landing, habitaciones, etc)
        const isProtectedRoute = pathname.startsWith('/modules')

        if (status === 'unauthenticated' && isProtectedRoute) {
            router.replace('/auth/login')
        }
    }, [status, pathname, router])

    return <>{children}</>
}

function HydrationSafeWrapper({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div style={{ visibility: 'hidden', minHeight: '100vh' }} />
    }

    return <SessionGuard>{children}</SessionGuard>
}

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        // refetchInterval verifica el estado de la sesión en el servidor cada 30 segundos.
        // Si el admin lo pone como "inactivo", la sesión del servidor devolverá null
        // y el SessionGuard cerrará la sesión en todos los dispositivos al instante.
        <SessionProvider refetchInterval={30}>
            <HydrationSafeWrapper>{children}</HydrationSafeWrapper>
        </SessionProvider>
    )
}