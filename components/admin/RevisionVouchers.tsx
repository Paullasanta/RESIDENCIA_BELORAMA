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
                        <div key={v.id} className="p-4 sm:p-5 rounded-[1.5rem] border border-gray-50 bg-gray-50/30 group hover:bg-white hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-300">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                                        <FileText size={20} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="font-black text-[#072E1F] text-sm leading-tight">{v.residente.user.nombre}</p>
                                        <div className="flex items-center gap-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                            <span className="text-[#1D9E75] font-black">S/ {v.monto.toLocaleString('es-MX')}</span>
                                            <span>•</span>
                                            <span>{new Date(v.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2 sm:ml-4">
                                    {v.comprobante && (
                                        <button 
                                            onClick={() => {
                                                setPreviewUrl(v.comprobante)
                                                setPreviewTitle(v.residente.user.nombre)
                                            }}
                                            className="flex-1 sm:flex-none h-11 px-4 flex items-center justify-center bg-white border border-gray-100 text-[#1D9E75] rounded-xl hover:bg-[#1D9E75] hover:text-white hover:border-[#1D9E75] transition-all"
                                            title="Ver comprobante"
                                        >
                                            <Eye size={18} className="sm:mr-2" />
                                            <span className="sm:hidden text-[10px] font-black uppercase ml-2">Ver</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleApprove(v.id)}
                                        disabled={isPending}
                                        className="flex-1 sm:flex-none h-11 px-5 bg-[#1D9E75] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#157a5a] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#1D9E75]/20"
                                    >
                                        {isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} strokeWidth={3} />}
                                        <span className={v.comprobante ? 'hidden lg:inline' : ''}>Aprobar</span>
                                    </button>
                                    <button
                                        onClick={() => handleReject(v.id)}
                                        disabled={isPending}
                                        className="flex-1 sm:flex-none h-11 px-5 bg-red-50 text-red-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 border border-red-100"
                                    >
                                        <X size={16} strokeWidth={3} />
                                        <span className={v.comprobante ? 'hidden lg:inline' : ''}>Rechazar</span>
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
