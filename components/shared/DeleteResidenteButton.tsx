'use client'

import { useTransition } from 'react'
import { deleteResidente } from '@/app/actions/residentes'
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useConfirmStore } from '@/store/useConfirmStore'

export function DeleteResidenteButton({ id, nombre }: { id: number, nombre: string }) {
  const [isPending, startTransition] = useTransition()

  const confirmAction = useConfirmStore(state => state.confirm)

  async function handleDelete() {
    const ok = await confirmAction({
      title: 'Inactivar Residente',
      message: `¿Estás seguro de que deseas inactivar a ${nombre}? Se liberará su habitación y pasará a la lista de inactivos.`,
      confirmText: 'Inactivar',
      variant: 'danger'
    })

    if (ok) {
      startTransition(async () => {
        const result = await deleteResidente(id)
        if (!result.success) {
          toast.error(result.error || 'Error al inactivar residente')
        } else {
          toast.success('Residente inactivado con éxito')
        }
      })
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
      title="Inactivar residente"
    >
      {isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
    </button>
  )
}
