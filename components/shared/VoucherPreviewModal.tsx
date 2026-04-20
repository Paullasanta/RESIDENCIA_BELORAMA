'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Download, ZoomIn } from 'lucide-react'

interface VoucherPreviewModalProps {
    imageUrl: string
    isOpen: boolean
    onClose: () => void
    title: string
}

export default function VoucherPreviewModal({ imageUrl, isOpen, onClose, title }: VoucherPreviewModalProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    if (!isOpen || !mounted) return null

    const modalContent = (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#072E1F]/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative w-full max-w-4xl h-full flex flex-col items-center justify-center gap-6 overflow-hidden">
                {/* Header Actions */}
                <div className="absolute top-4 right-4 flex items-center gap-4 z-10">
                    <a 
                        href={imageUrl} 
                        download 
                        className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl backdrop-blur-xl border border-white/10 transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest"
                    >
                        <Download size={18} />
                        Descargar
                    </a>
                    <button 
                        onClick={onClose}
                        className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl backdrop-blur-xl border border-white/10 transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="text-center space-y-1 mb-4 select-none">
                    <h3 className="text-white text-lg font-black tracking-tight">{title}</h3>
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Vista previa del comprobante</p>
                </div>

                {/* Image Container */}
                <div className="relative w-full h-[80vh] bg-white/5 rounded-[3rem] border border-white/10 p-4 flex items-center justify-center overflow-hidden animate-in zoom-in-95 duration-500 shadow-2xl shadow-black/50">
                    {imageUrl.toLowerCase().endsWith('.pdf') ? (
                        <iframe 
                            src={imageUrl} 
                            className="w-full h-full rounded-[2.5rem]"
                            title="Voucher PDF"
                        />
                    ) : (
                        <img 
                            src={imageUrl} 
                            alt="Voucher Preview" 
                            className="max-w-full max-h-full object-contain rounded-2xl cursor-zoom-in"
                        />
                    )}
                </div>
            </div>
        </div>
    )

    return createPortal(modalContent, document.body)
}
