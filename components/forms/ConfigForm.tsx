'use client'

import { useState, useTransition } from 'react'
import { updateConfig } from '@/app/actions/config'
import { Loader2, Save, Globe, Info, Mail } from 'lucide-react'

interface ConfigFormProps {
    initialConfig: Record<string, string>
}

export function ConfigForm({ initialConfig }: ConfigFormProps) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [previewName, setPreviewName] = useState(initialConfig.SYSTEM_NAME || 'Grow Residencial')

    async function handleSubmit(formData: FormData) {
        setSuccess(false)
        const data = {
            SYSTEM_NAME: formData.get('SYSTEM_NAME') as string,
            SUPPORT_EMAIL: formData.get('SUPPORT_EMAIL') as string,
            FOOTER_TEXT: formData.get('FOOTER_TEXT') as string,
            CELULAR_CONTACTO: (formData.get('CELULAR_CONTACTO') as string).replace(/\s/g, ''),
            WHATSAPP_CONTACTO: (formData.get('WHATSAPP_CONTACTO') as string).replace(/\s/g, ''),
        }

        if (!window.confirm('¿Estás seguro de que deseas guardar estos cambios en la configuración del sistema?')) {
            return
        }

        startTransition(async () => {
            const result = await updateConfig(data)
            if (result.success) {
                setSuccess(true)
            } else {
                setError(result.error as string)
            }
        })
    }

    return (
        <form action={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                {/* Lado izquierdo: Ajustes Generales */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/50 space-y-8">
                        <header className="flex items-center gap-4 mb-2">
                            <div className="w-10 h-10 rounded-2xl bg-[#1D9E75]/10 flex items-center justify-center text-[#1D9E75]">
                                <Globe size={20} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-[#072E1F]">Identidad del Sistema</h3>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Personaliza cómo se ve tu plataforma.</p>
                            </div>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Nombre Comercial</label>
                                <input
                                    name="SYSTEM_NAME"
                                    required
                                    value={previewName}
                                    onChange={(e) => setPreviewName(e.target.value)}
                                    className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-black text-gray-700"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Mail size={14} className="text-[#1D9E75]" /> Correo de Soporte
                                </label>
                                <input
                                    name="SUPPORT_EMAIL"
                                    type="email"
                                    defaultValue={initialConfig.SUPPORT_EMAIL}
                                    required
                                    className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-bold text-gray-700"
                                    placeholder="soporte@growresidencial.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Celular de Contacto</label>
                                <input
                                    name="CELULAR_CONTACTO"
                                    defaultValue={initialConfig.CELULAR_CONTACTO}
                                    placeholder="+51 999 999 999"
                                    className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-bold text-gray-700"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">WhatsApp de Contacto</label>
                                <input
                                    name="WHATSAPP_CONTACTO"
                                    defaultValue={initialConfig.WHATSAPP_CONTACTO}
                                    placeholder="51999999999"
                                    className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-bold text-gray-700"
                                />
                            </div>

                            <div className="space-y-2 col-span-full">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Texto del Pie de Página</label>
                                <input
                                    name="FOOTER_TEXT"
                                    defaultValue={initialConfig.FOOTER_TEXT}
                                    className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-medium text-gray-400"
                                    placeholder="© 2024 Grow Residencial - Todos los derechos reservados."
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                            {success && <p className="text-sm font-black text-green-500 animate-bounce">✓ Guardado correctamente</p>}
                            <button
                                type="submit"
                                disabled={isPending}
                                className="ml-auto bg-[#1D9E75] hover:bg-[#167e5d] text-white rounded-2xl px-12 py-4 font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-[#1D9E75]/20 disabled:opacity-50 flex items-center gap-3"
                            >
                                {isPending ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <Save size={18} />
                                )}
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>

                {/* Lado derecho: Previsualización */}
                <div className="space-y-8">
                    <div className="bg-[#072E1F] p-8 rounded-[2.5rem] shadow-2xl shadow-[#072E1F]/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4">
                            <span className="px-3 py-1 bg-white/10 rounded-full text-[8px] font-black text-white/50 uppercase tracking-widest border border-white/5">Preview</span>
                        </div>

                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-6">Barra Lateral</p>

                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 bg-[#1D9E75] rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-xl shadow-black/20">
                                {previewName.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-lg font-black tracking-tight leading-tight text-white">{previewName}</h2>
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-0.5">ADMINISTRACIÓN</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`h-10 rounded-xl flex items-center px-4 gap-3 ${i === 1 ? 'bg-white/10' : 'bg-transparent'}`}>
                                    <div className={`w-4 h-4 rounded-full ${i === 1 ? 'bg-[#1D9E75]' : 'bg-white/10'}`} />
                                    <div className={`h-2 rounded-full ${i === 1 ? 'bg-white w-24' : 'bg-white/20 w-32'}`} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2rem] border border-[#EF9F27]/20 shadow-xl shadow-[#EF9F27]/5 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-[#EF9F27]/10 flex items-center justify-center text-[#EF9F27] shrink-0">
                            <Info size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-black text-[#072E1F] mb-1">Dato importante</p>
                            <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                Los cambios realizados en la identidad afectarán a todos los usuarios en tiempo real después de recargar la página.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    )
}
