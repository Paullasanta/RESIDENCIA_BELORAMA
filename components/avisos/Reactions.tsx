'use client'

import { useState, useTransition } from 'react'
import { Heart, CheckCircle2 } from 'lucide-react'
import { toggleReaccion } from '@/app/actions/avisos'

interface ReactionsProps {
    avisoId: number
    reacciones: any[]
    currentUserEmail: string
}

export function Reactions({ avisoId, reacciones, currentUserEmail }: ReactionsProps) {
    const [isPending, startTransition] = useTransition()
    
    // Contar reacciones
    const heartCount = reacciones.filter(r => r.emoji === '❤️').length
    const checkCount = reacciones.filter(r => r.emoji === '✅').length
    
    // Verificar si el usuario ya reaccionó
    const hasHeart = reacciones.some(r => r.emoji === '❤️' && r.user.email === currentUserEmail)
    const hasCheck = reacciones.some(r => r.emoji === '✅' && r.user.email === currentUserEmail)

    const handleToggle = (emoji: string) => {
        startTransition(async () => {
            await toggleReaccion(avisoId, emoji)
        })
    }

    return (
        <div className="flex items-center gap-4">
            <button 
                onClick={() => handleToggle('❤️')}
                disabled={isPending}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all ${
                    hasHeart 
                    ? 'bg-red-50 text-red-500 border border-red-100' 
                    : 'bg-gray-50 text-gray-400 border border-gray-100 hover:bg-red-50/50 hover:text-red-400'
                }`}
            >
                <Heart size={18} fill={hasHeart ? 'currentColor' : 'none'} className={isPending ? 'animate-pulse' : ''} />
                <span className="text-sm font-black">{heartCount}</span>
            </button>

            <button 
                onClick={() => handleToggle('✅')}
                disabled={isPending}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all ${
                    hasCheck 
                    ? 'bg-green-50 text-[#1D9E75] border border-green-100' 
                    : 'bg-gray-50 text-gray-400 border border-gray-100 hover:bg-green-50/50 hover:text-[#1D9E75]'
                }`}
            >
                <CheckCircle2 size={18} fill={hasCheck ? 'currentColor' : 'none'} className={isPending ? 'animate-pulse' : ''} />
                <span className="text-sm font-black">{checkCount > 0 ? checkCount : 'Entendido'}</span>
            </button>
        </div>
    )
}
