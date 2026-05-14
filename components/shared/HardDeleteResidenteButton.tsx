'use client'

import { useState, useTransition } from 'react'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { hardDeleteResidente } from '@/app/actions/residentes'
import { useConfirmStore } from '@/store/useConfirmStore'
import { toast } from 'sonner'

interface HardDeleteResidenteButtonProps {
  id: number
  nombre: string
}

export function HardDeleteResidenteButton({ id, nombre }: HardDeleteResidenteButtonProps) {
  const [isPending, startTransition] = useTransition()
  const confirmAction = useConfirmStore(state => state.confirm)

  const handleDelete = async () => {
    const ok = await confirmAction({
      title: '¿Eliminar Permanentemente?',
      message: `Esta acción eliminará a ${nombre} y TODOS sus registros (pagos, turnos, perfil) de la base de datos. No se puede deshacer.`,
      confirmText: 'SÍ, ELIMINAR TODO',
      variant: 'danger'
    })

    if (!ok) return

    startTransition(async () => {
      const result = await hardDeleteResidente(id)
      if (result.success) {
        toast.success('Residente eliminado permanentemente')
      } else {
        toast.error(result.error || 'Error al eliminar')
      }
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 bg-red-50/50 hover:bg-red-50 rounded-lg border border-red-100 transition-all disabled:opacity-50"
      title="Eliminar de la BD permanentemente"
    >
      {isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
    </button>
  )
}
