'use client'

import { useState, useTransition, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { updateProfile } from '@/app/actions/perfil'
import { User, Mail, Phone, Lock, Camera, X, Save, CheckCircle2, AlertCircle, HeartPulse, Calendar } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface ProfileModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
    const { data: session, update } = useSession()
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [userData, setUserData] = useState<any>(null)
    const [uploading, setUploading] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        if (isOpen && session?.user?.id) {
            fetch(`/api/user/${session.user.id}`)
                .then(res => res.json())
                .then(data => setUserData(data))
        }
        return () => setMounted(false)
    }, [isOpen, session])

    if (!isOpen || !mounted) return null

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch('/api/upload', { method: 'POST', body: formData })
            const { url } = await res.json()
            
            startTransition(async () => {
                const result = await updateProfile({ imagen: url })
                if (result.success) {
                    await update({ 
                        user: { ...session?.user, imagen: url } 
                    })
                    router.refresh()
                    setUserData({ ...userData, imagen: url })
                    setMessage({ type: 'success', text: 'Foto actualizada' })
                }
            })
        } catch (error) {
            setMessage({ type: 'error', text: 'Error al subir imagen' })
        } finally {
            setUploading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const data = Object.fromEntries(formData)

        startTransition(async () => {
            const res = await updateProfile(data as any)
            if (res.success) {
                await update({
                    user: { 
                        ...session?.user, 
                        nombre: (data as any).nombre,
                        apellidos: (data as any).apellidos
                    }
                })
                router.refresh()
                setMessage({ type: 'success', text: 'Perfil actualizado' })
                setTimeout(onClose, 1500)
            } else {
                setMessage({ type: 'error', text: res.error || 'Error al actualizar' })
            }
        })
    }

    const modalContent = (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-10 bg-[#072E1F]/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-4xl h-full max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-500">
                {/* Header */}
                <div className="p-8 border-b border-gray-50 flex items-center justify-between shrink-0">
                    <div>
                        <h3 className="text-2xl font-black text-[#072E1F] tracking-tight">Editar Mi Perfil</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Personaliza tu experiencia en Belorama</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-gray-50 rounded-2xl transition-all text-gray-400 hover:text-gray-900">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12 custom-scrollbar">
                    {message && (
                        <div className={`p-4 rounded-[1.5rem] flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                            <p className="text-[10px] font-black uppercase tracking-widest">{message.text}</p>
                        </div>
                    )}

                    {!userData ? (
                        <div className="py-20 text-center animate-pulse font-black text-gray-300 tracking-widest uppercase text-xs">Cargando datos...</div>
                    ) : (
                        <form id="profile-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {/* Col 1: Photo & Basic Info */}
                            <div className="space-y-10">
                                <div className="flex flex-col items-center gap-6 p-8 bg-gray-50/50 rounded-[2.5rem] border border-gray-100">
                                    <div className="relative">
                                        <div className="w-32 h-32 rounded-[2rem] overflow-hidden bg-gray-200 border-4 border-white shadow-xl">
                                            {userData.imagen ? (
                                                <img src={userData.imagen} alt="Perfil" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-[#EF9F27]/20 text-[#EF9F27]">
                                                    <User size={48} />
                                                </div>
                                            )}
                                            {uploading && (
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                                                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                        <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#1D9E75] text-white rounded-xl flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-all border-4 border-white">
                                            <Camera size={18} />
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                        </label>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">DNI / Documento</p>
                                        <p className="font-black text-[#072E1F]">{userData.dni || 'S/N'}</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2 text-left">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><User size={12} /> Nombres</label>
                                        <input name="nombre" defaultValue={userData.nombre} className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] outline-none transition-all font-bold text-gray-700" />
                                    </div>
                                    <div className="space-y-2 text-left">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><User size={12} /> Apellidos</label>
                                        <input name="apellidos" defaultValue={userData.apellidos} className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] outline-none transition-all font-bold text-gray-700" />
                                    </div>
                                </div>
                            </div>

                            {/* Col 2: Contact & Security */}
                            <div className="space-y-8">
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-[#1D9E75] uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Phone size={14} /> Contacto y Salud
                                    </h4>
                                    <div className="space-y-2 text-left">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Teléfono Móvil</label>
                                        <input name="telefono" defaultValue={userData.telefono} className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] outline-none transition-all font-bold text-gray-700" />
                                    </div>
                                    <div className="space-y-2 text-left">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Calendar size={12} /> Fecha Nacimiento</label>
                                        <input name="fechaNacimiento" type="date" defaultValue={userData.fechaNacimiento ? new Date(userData.fechaNacimiento).toISOString().split('T')[0] : ''} className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] outline-none transition-all font-bold text-gray-700" />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <HeartPulse size={14} /> Emergencias
                                    </h4>
                                    <div className="space-y-4 bg-red-50/30 p-6 rounded-3xl border border-red-50">
                                        <div className="space-y-2 text-left">
                                            <label className="text-[10px] font-black text-red-300 uppercase tracking-widest ml-1">Contacto Nombre</label>
                                            <input name="emergenciaNombre" defaultValue={userData.emergenciaNombre} className="w-full px-4 py-3 rounded-xl border border-red-100/50 bg-white focus:border-red-400 outline-none transition-all font-bold text-gray-700 text-sm" />
                                        </div>
                                        <div className="space-y-2 text-left">
                                            <label className="text-[10px] font-black text-red-300 uppercase tracking-widest ml-1">Contacto Teléfono</label>
                                            <input name="emergenciaTelefono" defaultValue={userData.emergenciaTelefono} className="w-full px-4 py-3 rounded-xl border border-red-100/50 bg-white focus:border-red-400 outline-none transition-all font-bold text-gray-700 text-sm" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Lock size={14} /> Seguridad
                                    </h4>
                                    <div className="space-y-2 text-left">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nueva Contraseña</label>
                                        <input name="password" type="password" placeholder="••••••••" className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] outline-none transition-all font-bold text-gray-700" />
                                    </div>
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 bg-gray-50/50 border-t border-gray-50 flex items-center justify-end gap-4 shrink-0">
                    <button onClick={onClose} className="px-8 py-4 rounded-2xl text-xs font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-all">
                        Cerrar sin guardar
                    </button>
                    <button 
                        type="submit" 
                        form="profile-form"
                        disabled={isPending || !userData}
                        className="bg-[#072E1F] hover:bg-[#1D9E75] text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-[#072E1F]/20 disabled:opacity-50 flex items-center gap-3"
                    >
                        {isPending ? 'Guardando...' : <><Save size={16} /> Guardar Cambios</>}
                    </button>
                </div>
            </div>
        </div>
    )

    return createPortal(modalContent, document.body)
}
