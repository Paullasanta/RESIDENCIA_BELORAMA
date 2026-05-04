'use client'

import { useState } from 'react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import VoucherPreviewModal from '@/components/shared/VoucherPreviewModal'
import { Eye } from 'lucide-react'

export function PagoItemAdmin({ pago, isHistorical = false }: { pago: any; isHistorical?: boolean }) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    const dObj = pago.fechaVencimiento ? new Date(pago.fechaVencimiento) : null
    const day = dObj ? dObj.getUTCDate() : '—'
    const monthShort = dObj
        ? dObj.toLocaleDateString('es-MX', { month: 'short', timeZone: 'UTC' }).replace('.', '')
        : '—'

    const isPagado = pago.estado === 'PAGADO'
    const hasVoucher = isPagado && !!pago.comprobante

    return (
        <>
            <div
                className={`p-4 sm:p-8 flex items-center justify-between hover:bg-gray-50/30 transition-colors ${
                    isHistorical ? 'py-3 sm:py-4' : ''
                }`}
            >
                <div className="flex items-center gap-3 sm:gap-6 min-w-0">
                    <div
                        className={`w-11 h-11 sm:w-14 sm:h-14 rounded-2xl flex flex-col items-center justify-center font-black border shrink-0 ${
                            pago.estado === 'PAGADO'
                                ? 'bg-green-50 text-green-600 border-green-100'
                                : pago.estado === 'EN_REVISION'
                                ? 'bg-blue-50 text-blue-600 border-blue-100'
                                : pago.estado === 'RECHAZADO'
                                ? 'bg-red-50 text-red-300 border-red-100'
                                : 'bg-gray-50 text-gray-400 border-gray-100'
                        }`}
                    >
                        <span className="text-[8px] sm:text-[10px] uppercase leading-none mb-0.5 sm:mb-1 opacity-60">
                            {monthShort}
                        </span>
                        <span className="text-sm sm:text-lg leading-none">{day}</span>
                    </div>

                    <div className="min-w-0">
                        <p
                            className={`text-sm sm:text-lg font-black text-[#072E1F] leading-tight mb-1 truncate ${
                                isHistorical ? 'text-xs text-gray-400' : ''
                            }`}
                        >
                            {pago.concepto}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            <span className={isHistorical ? 'text-gray-300' : 'text-[#1D9E75] font-black'}>
                                S/ {pago.monto.toLocaleString('es-MX')}
                            </span>
                            <span className="hidden sm:inline">•</span>
                            <span className="truncate">
                                Vence:{' '}
                                {dObj
                                    ? dObj.toLocaleDateString('es-MX', {
                                          day: 'numeric',
                                          month: 'short',
                                          timeZone: 'UTC',
                                      })
                                    : 'N/A'}
                            </span>
                            {isPagado && pago.fechaPago && (
                                <>
                                    <span className="hidden sm:inline text-green-300">•</span>
                                    <span className="text-green-600 font-black truncate bg-green-50 px-2 py-0.5 rounded-md border border-green-100">
                                        Pagado:{' '}
                                        {new Date(pago.fechaPago).toLocaleDateString('es-MX', {
                                            day: 'numeric',
                                            month: 'short',
                                            timeZone: 'UTC',
                                        })}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 ml-2 shrink-0">
                    {hasVoucher && (
                        <button
                            onClick={() => setPreviewUrl(pago.comprobante)}
                            title="Ver comprobante de pago"
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#1D9E75]/10 text-[#1D9E75] border border-[#1D9E75]/20 hover:bg-[#1D9E75] hover:text-white hover:shadow-lg hover:shadow-[#1D9E75]/20 transition-all active:scale-90"
                        >
                            <Eye size={16} strokeWidth={2.5} />
                        </button>
                    )}
                    <StatusBadge status={pago.estado as any} />
                </div>
            </div>

            {previewUrl && (
                <VoucherPreviewModal
                    imageUrl={previewUrl}
                    title={`${pago.concepto} — S/ ${pago.monto.toLocaleString('es-MX')}`}
                    isOpen={!!previewUrl}
                    onClose={() => setPreviewUrl(null)}
                />
            )}
        </>
    )
}
