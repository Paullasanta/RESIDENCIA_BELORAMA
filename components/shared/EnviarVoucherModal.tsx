'use client'

import { useState, useRef, useTransition, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Upload, X, Loader2, Check, CreditCard, Smartphone, Banknote } from 'lucide-react'
import { enviarComprobantePago } from '@/app/actions/pagos'

interface EnviarVoucherModalProps {
    pagoId: number
    concepto: string
    isOpen: boolean
    onClose: () => void
}

export default function EnviarVoucherModal({ pagoId, concepto, isOpen, onClose }: EnviarVoucherModalProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [metodo, setMetodo] = useState('YAPE')
    const [mounted, setMounted] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    if (!isOpen || !mounted) return null

    async function handleSubmit() {
        if (!file) return
        
        setUploading(true)
        try {
            // 1. Upload to API
            const formData = new FormData()
            formData.append('file', file)
            
            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })

            if (!uploadRes.ok) throw new Error('Error al subir archivo')
            const { url } = await uploadRes.json()

            // 2. Server Action
            startTransition(async () => {
                const res = await enviarComprobantePago({
                    pagoId,
                    comprobante: url,
                    metodoPago: metodo
                })

                if (res.success) {
                    router.refresh()
                    onClose()
                } else {
                    alert('Error: ' + res.error)
                }
            })
        } catch (error) {
            console.error(error)
            alert('Error al procesar el envío')
        } finally {
            setUploading(false)
        }
    }

    const modalContent = (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#072E1F]/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black text-[#072E1F] tracking-tight">Reportar Pago</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{concepto}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* Método de Pago */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1">Selecciona Método</label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'YAPE', name: 'Yape', icon: Smartphone, color: 'purple' },
                                { id: 'PLIN', name: 'Plin', icon: CreditCard, color: 'blue' },
                                { id: 'TRANSFERENCIA', name: 'BCP/BBVA', icon: Banknote, color: 'green' }
                            ].map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => setMetodo(m.id)}
                                    className={`flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all gap-2 ${metodo === m.id ? 'border-[#1D9E75] bg-[#1D9E75]/5' : 'border-gray-50 hover:border-gray-100'}`}
                                >
                                    <m.icon size={24} className={metodo === m.id ? 'text-[#1D9E75]' : 'text-gray-300'} />
                                    <span className={`text-[10px] font-black uppercase tracking-tighter ${metodo === m.id ? 'text-[#1D9E75]' : 'text-gray-400'}`}>{m.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dropbox */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1">Comprobante / Captura</label>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="hidden" 
                            accept="image/*,application/pdf"
                        />
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer ${file ? 'border-[#1D9E75] bg-[#1D9E75]/5' : 'border-gray-100 hover:border-[#1D9E75] hover:bg-gray-50'}`}
                        >
                            {file ? (
                                <>
                                    <div className="w-12 h-12 bg-[#1D9E75] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#1D9E75]/20">
                                        <Check size={24} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-black text-gray-700">{file.name}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Archivo seleccionado — Cambiar</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
                                        <Upload size={32} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-black text-[#072E1F]">Sube tu captura aquí</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">JPG, PNG o PDF (Máx 5MB)</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-gray-50/50 flex gap-3">
                    <button 
                        onClick={onClose}
                        className="flex-1 px-8 py-4 rounded-2xl text-xs font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-all"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={!file || uploading || isPending}
                        className="flex-[2] bg-[#1D9E75] hover:bg-[#167e5d] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-[#1D9E75]/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {(uploading || isPending) ? <Loader2 size={16} className="animate-spin" /> : 'Enviar Comprobante'}
                    </button>
                </div>
            </div>
        </div>
    )

    return createPortal(modalContent, document.body)
}
