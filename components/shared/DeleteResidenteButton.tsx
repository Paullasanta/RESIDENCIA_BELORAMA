'use client'

import { useTransition } from 'react'
import { deleteResidente } from '@/app/actions/residentes'
import { Trash2, Loader2 } from 'lucide-react'

export function DeleteResidenteButton({ id, nombre }: { id: number, nombre: string }) {
  const [isPending, startTransition] = useTransition()

  async function handleDelete() {
    if (confirm(`¿Estás seguro de que deseas eliminar a ${nombre}? Esta acción no se puede deshacer.`)) {
      startTransition(async () => {
        const result = await deleteResidente(id)
        if (!result.success) {
          alert('Error: ' + result.error)
        }
      })
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
      title="Eliminar residente"
    >
      {isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
    </button>
  )
}
