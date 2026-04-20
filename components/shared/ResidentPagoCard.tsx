'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, UploadCloud } from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import EnviarVoucherModal from './EnviarVoucherModal'

interface ResidentPagoCardProps {
    pago: any
}

export default function ResidentPagoCard({ pago }: ResidentPagoCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const progPct = pago.monto > 0 ? Math.round((pago.montoPagado / pago.monto) * 100) : 0
    
    // Solo permitir subir si está pendiente o rechazado
    const canUpload = pago.estado === 'PENDIENTE' || pago.estado === 'RECHAZADO'

    return (
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden flex flex-col group hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
            <div className="p-10 pb-6">
                <div className="flex items-start justify-between mb-8">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#EF9F27]">{pago.concepto}</p>
                        <p className="text-4xl font-black text-gray-900 tracking-tighter">S/ {pago.monto.toLocaleString('es-MX')}</p>
                    </div>
                    <StatusBadge status={pago.estado as any} />
                </div>
                
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <p className="text-xs font-bold text-gray-500">Progreso del pago</p>
                        <p className="text-xs font-black text-[#1D9E75]">{progPct}%</p>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden p-0.5">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${progPct === 100 ? 'bg-green-500' : 'bg-[#1D9E75]'}`}
                            style={{ width: `${progPct}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="mt-auto px-10 py-6 bg-gray-50/30 border-t border-gray-50 flex flex-wrap items-center justify-between gap-4 group-hover:bg-white transition-colors">
                 <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                     Vencido el {new Date(pago.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}
                 </div>
                 
                 <div className="flex items-center gap-4">
                    {canUpload && (
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="bg-[#1D9E75] text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#167e5d] transition-all shadow-lg shadow-[#1D9E75]/20"
                        >
                            Reportar Pago <UploadCloud size={14} />
                        </button>
                    )}
                    <Link href={`/modules/pagos/${pago.id}`} className="flex items-center gap-2 text-[10px] font-black text-[#1D9E75] hover:text-[#072E1F] uppercase tracking-widest transition-all">
                        Ver Cuotas <Eye size={14} />
                    </Link>
                 </div>
            </div>

            <EnviarVoucherModal 
                pagoId={pago.id}
                concepto={pago.concepto}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    )
}
