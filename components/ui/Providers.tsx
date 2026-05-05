'use client'

import { SessionProvider } from 'next-auth/react'
import { useEffect, useState } from 'react'

function HydrationSafeWrapper({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Antes del montaje, renderizamos un div invisible para evitar
    // el mismatch causado por extensiones de navegador (ej: bis_skin_checked)
    if (!mounted) {
        return <div style={{ visibility: 'hidden', minHeight: '100vh' }} />
    }

    return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <HydrationSafeWrapper>{children}</HydrationSafeWrapper>
        </SessionProvider>
    )
}