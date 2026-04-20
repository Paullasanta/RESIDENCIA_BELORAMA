'use client'

import { useTransition, useState } from 'react'
import { approveVoucher, rejectVoucher } from '@/app/actions/pagos'
import { useRouter } from 'next/navigation'
import { Check, X, FileText, Loader2, Eye } from 'lucide-react'
import VoucherPreviewModal from '../shared/VoucherPreviewModal'

interface RevisionVouchersProps {
    vouchers: any[]
}

export function RevisionVouchers({ vouchers }: RevisionVouchersProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [previewTitle, setPreviewTitle] = useState('')

    const handleApprove = (id: number) => {
        startTransition(async () => {
            const res = await approveVoucher(id)
            if (res.success) router.refresh()
        })
    }

    const handleReject = (id: number) => {
        startTransition(async () => {
            const res = await rejectVoucher(id)
            if (res.success) router.refresh()
        })
    }

    return (
        <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-xl shadow-gray-200/30">
            <h3 className="text-sm font-black text-[#072E1F] uppercase tracking-widest mb-6">Comprobantes pendientes de revisión</h3>
            
            {vouchers.length === 0 ? (
                <div className="py-10 text-center space-y-3">
                    <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto text-gray-300">
                        <Check size={32} />
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sin pendientes</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {vouchers.map((v) => (
                        <div key={v.id} className="p-5 rounded-2xl border border-gray-50 bg-gray-50/20 group hover:bg-white hover:shadow-lg transition-all duration-300">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="font-black text-gray-900 leading-none">{v.residente.user.nombre}</p>
                                    <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                        <span>S/ {v.monto.toLocaleString('es-MX')}</span>
                                        <span>•</span>
                                        <span>{new Date(v.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</span>
                                        {v.metodoPago && (
                                            <>
                                                <span>•</span>
                                                <span className="text-[#1D9E75]">{v.metodoPago}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    {v.comprobante && (
                                        <button 
                                            onClick={() => {
                                                setPreviewUrl(v.comprobante)
                                                setPreviewTitle(v.residente.user.nombre)
                                            }}
                                            className="w-10 h-10 flex items-center justify-center bg-[#1D9E75]/10 text-[#1D9E75] rounded-xl hover:bg-[#1D9E75] hover:text-white transition-all mr-2"
                                            title="Ver comprobante"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleApprove(v.id)}
                                        disabled={isPending}
                                        className="h-10 px-4 bg-[#1D9E75] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#167e5d] transition-all disabled:opacity-50"
                                    >
                                        Aprobar
                                    </button>
                                    <button
                                        onClick={() => handleReject(v.id)}
                                        disabled={isPending}
                                        className="h-10 px-4 bg-red-50 text-red-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
                                    >
                                        Rechazar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {previewUrl && (
                <VoucherPreviewModal 
                    imageUrl={previewUrl}
                    title={previewTitle}
                    isOpen={!!previewUrl}
                    onClose={() => setPreviewUrl(null)}
                />
            )}
        </div>
    )
}
