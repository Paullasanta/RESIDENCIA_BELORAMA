'use client'

import { useState, useTransition } from 'react'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { hardDeleteResidente } from '@/app/actions/residentes'

interface HardDeleteResidenteButtonProps {
  id: number
  nombre: string
}

export function HardDeleteResidenteButton({ id, nombre }: HardDeleteResidenteButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      const result = await hardDeleteResidente(id)
      if (result.success) {
        setShowConfirm(false)
      } else {
        alert('Error: ' + result.error)
      }
    })
  }

  if (showConfirm) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#072E1F]/60 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 text-center animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 mx-auto mb-6">
            <AlertTriangle size={40} />
          </div>
          <h3 className="text-2xl font-black text-[#072E1F] mb-2">¿Eliminar Permanentemente?</h3>
          <p className="text-sm text-gray-400 font-bold leading-relaxed mb-8">
            Esta acción eliminará a <span className="text-red-500">{nombre}</span> y <span className="text-red-500 italic">TODOS</span> sus registros (pagos, turnos, perfil) de la base de datos. No se puede deshacer.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-red-500/20 transition-all flex items-center justify-center gap-2"
            >
              {isPending ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
              Confirmar Eliminación Total
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              disabled={isPending}
              className="w-full py-4 bg-gray-50 hover:bg-gray-100 text-gray-400 rounded-2xl font-black uppercase tracking-widest transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 bg-red-50/50 hover:bg-red-50 rounded-lg border border-red-100 transition-all"
      title="Eliminar de la BD permanentemente"
    >
      <Trash2 size={14} />
    </button>
  )
}
