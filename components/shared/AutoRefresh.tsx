'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface AutoRefreshProps {
    interval?: number // Intervalo en milisegundos
}

export function AutoRefresh({ interval = 30000 }: AutoRefreshProps) {
    const router = useRouter()

    useEffect(() => {
        // Ejecuta router.refresh() cada X milisegundos para obtener la versión más reciente
        // del Server Component sin recargar la página completamente.
        // Next.js automáticamente optimiza esto combinándolo con su Router Cache.
        const timer = setInterval(() => {
            router.replace(window.location.pathname + window.location.search, { scroll: false })
        }, interval)

        return () => clearInterval(timer)
    }, [router, interval])

    return null
}
