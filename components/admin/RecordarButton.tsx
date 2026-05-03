'use client'
import { useState, useTransition } from 'react'
import { sendPaymentReminder } from '@/app/actions/pagos'
import { Loader2, Bell } from 'lucide-react'

interface RecordarButtonProps {
    residenteId: number
}

export function RecordarButton({ residenteId }: RecordarButtonProps) {
    const [isPending, startTransition] = useTransition()
    const [sent, setSent] = useState(false)

    const handleRemind = () => {
        startTransition(async () => {
            const result = await sendPaymentReminder(residenteId)
            if (result.success) {
                setSent(true)
                setTimeout(() => setSent(false), 3000)
            } else {
                alert(result.error)
            }
        })
    }

    return (
        <button 
            onClick={handleRemind}
            disabled={isPending || sent}
            className={`w-10 h-10 rounded-xl border transition-all flex items-center justify-center ${
                sent 
                ? 'bg-green-50 text-green-600 border-green-100' 
                : 'bg-red-50 text-red-500 border-red-100 hover:bg-red-500 hover:text-white'
            } disabled:opacity-70`}
            title={sent ? "Enviado" : "Enviar Recordatorio"}
        >
            {isPending ? (
                <Loader2 size={16} className="animate-spin" />
            ) : sent ? (
                <Bell size={16} fill="currentColor" />
            ) : (
                <Bell size={16} />
            )}
        </button>
    )
}
