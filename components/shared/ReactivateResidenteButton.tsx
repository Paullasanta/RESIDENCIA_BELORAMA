'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { ReactivateResidenteModal } from '@/components/admin/ReactivateResidenteModal'

export function ReactivateResidenteButton({ id, nombre, defaultMontoMensual, defaultMontoGarantia }: { 
  id: number, 
  nombre: string,
  defaultMontoMensual?: number,
  defaultMontoGarantia?: number
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2"
        title="Reactivar residente"
      >
        <RefreshCw size={14} />
        Reactivar
      </button>

      <ReactivateResidenteModal 
        id={id}
        nombre={nombre}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        defaultMontoMensual={defaultMontoMensual}
        defaultMontoGarantia={defaultMontoGarantia}
      />
    </>
  )
}
