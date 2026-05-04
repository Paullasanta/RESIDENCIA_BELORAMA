'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, UploadCloud, Calendar } from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import EnviarVoucherModal from './EnviarVoucherModal'

interface ResidentPagoCardProps {
    pago: any
}

export default function ResidentPagoCard({ pago }: ResidentPagoCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const progPct = pago.estado === 'PAGADO' ? 100 : 0
    const canUpload = (pago.estado === 'PENDIENTE' || pago.estado === 'RECHAZADO' || pago.estado === 'VENCIDO' || pago.estado === 'CRITICO') && !pago.comprobante
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const fechaVencimiento = new Date(pago.fechaVencimiento || pago.createdAt)
    // Extraer año, mes y día en UTC (como se guardó) para formar la fecha local equivalente
    const fechaVencimientoSinHora = new Date(fechaVencimiento.getUTCFullYear(), fechaVencimiento.getUTCMonth(), fechaVencimiento.getUTCDate(), 0, 0, 0, 0)

    const esPagoFuturo = pago.estado === 'PENDIENTE' && fechaVencimientoSinHora > today
    const esHoy = fechaVencimientoSinHora.getTime() === today.getTime()
    
    const diffTime = fechaVencimientoSinHora.getTime() - today.getTime()
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
    // esPorVencer: cubre PENDIENTE y VENCIDO (por si fue marcado incorrectamente antes del fix)
    const esPorVencer = (pago.estado === 'PENDIENTE' || pago.estado === 'VENCIDO') && diffDays >= 0 && diffDays <= 3

    // Determinar si es el primer mes o garantía (estos nunca se bloquean)
    const fechaIngreso = pago.residente?.fechaIngreso ? new Date(pago.residente.fechaIngreso) : null
    let isFirstMonth = false
    if (fechaIngreso && pago.mesCorrespondiente) {
        const firstMonthStr = `${fechaIngreso.getUTCFullYear()}-${String(fechaIngreso.getUTCMonth() + 1).padStart(2, '0')}`
        if (pago.mesCorrespondiente === firstMonthStr) {
            isFirstMonth = true
        }
    }
    const isGuarantee = pago.concepto?.toLowerCase().includes('garantía') || pago.concepto?.toLowerCase().includes('garantia')
    const isFirstGuarantee = isGuarantee && (pago.concepto?.includes('Cuota 1/') || !pago.concepto?.includes('Cuota'))

    // Estado visual para el Badge
    const isLocked = diffDays > 15 && pago.estado === 'PENDIENTE' && !isFirstMonth && !isFirstGuarantee
    const statusVisual = isLocked ? 'PROXIMO' : (esPorVencer ? 'POR_VENCER' : pago.estado)

    return (
        <div className={`bg-white rounded-[2rem] shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden flex flex-col group hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 ${pago.estado === 'PAGADO' ? 'grayscale opacity-80' : ''}`}>
            <div className="p-6 md:p-10 pb-6">
                <div className="flex items-start justify-between mb-4 md:mb-8">
                    <div className="space-y-1">
                        <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${esPagoFuturo ? 'text-blue-500' : (esHoy || esPorVencer) ? 'text-orange-500' : 'text-[#EF9F27]'}`}>
                            {pago.concepto} {esPagoFuturo ? '(Próximo)' : esHoy ? '(Hoy)' : esPorVencer ? '(Por Vencer)' : ''}
                        </p>
                        <p className="text-2xl md:text-4xl font-black text-gray-900 tracking-tighter">
                            S/ {pago.monto.toLocaleString('es-MX')}
                        </p>
                    </div>
                    <StatusBadge status={statusVisual as any} />
                </div>
                
                <div className="space-y-3">
                    <div className="flex justify-between items-end">
                        <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">Estado de pago</p>
                        <p className="text-[10px] md:text-xs font-black text-[#1D9E75]">{progPct}%</p>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${progPct === 100 ? 'bg-green-500' : 'bg-[#1D9E75]'}`}
                            style={{ width: `${progPct}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="mt-auto px-10 py-6 bg-gray-50/30 border-t border-gray-50 flex flex-wrap items-center justify-between gap-4 group-hover:bg-white transition-colors">
                  <div className="text-[10px] font-black uppercase tracking-widest">
                      {pago.estado === 'PAGADO' ? (
                          <span className="text-green-600">
                              Pagado el {pago.fechaPago ? new Date(pago.fechaPago).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' }) : '---'}
                          </span>
                      ) : esHoy ? (
                          <span className="text-[#EF9F27]">
                              Vence hoy ({fechaVencimiento.toLocaleDateString('es-MX', { timeZone: 'UTC', day: 'numeric', month: 'long' })})
                          </span>
                      ) : (
                          <span className="text-gray-400">
                              {esPagoFuturo ? 'Vence el' : 'Vencido el'} {fechaVencimiento.toLocaleDateString('es-MX', { timeZone: 'UTC', day: 'numeric', month: 'long' })}
                          </span>
                      )}
                  </div>
                 
                 <div className="flex items-center gap-4">
                    {canUpload && (
                        isLocked ? (
                            <button 
                                disabled
                                className="bg-blue-50 text-blue-500 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 cursor-not-allowed border border-blue-100"
                                title="Falta mucho para el día de pago"
                            >
                                Próximo <Calendar size={14} />
                            </button>
                        ) : (
                            <button 
                                onClick={() => setIsModalOpen(true)}
                                className="bg-[#1D9E75] text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#167e5d] transition-all shadow-lg shadow-[#1D9E75]/20"
                            >
                                Reportar Pago <UploadCloud size={14} />
                            </button>
                        )
                    )}
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
