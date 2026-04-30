'use client'

import { useState, useTransition, useEffect } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { updateProfile } from '@/app/actions/perfil'
import { User, Mail, Phone, Lock, Save, AlertCircle, CheckCircle2, ShieldCheck, HeartPulse, Calendar } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { useSession } from 'next-auth/react'

export default function PerfilPage() {
    const { data: session, update } = useSession()
    const [isPending, startTransition] = useTransition()
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [userData, setUserData] = useState<any>(null)

    useEffect(() => {
        if (session?.user?.id) {
            fetch(`/api/user/${session.user.id}`)
                .then(res => res.json())
                .then(data => setUserData(data))
        }
    }, [session])

    if (!userData) return <div className="p-8 text-center animate-pulse font-black text-gray-300 tracking-widest uppercase text-xs">Cargando perfil...</div>



    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const data = Object.fromEntries(formData)

        startTransition(async () => {
            const res = await updateProfile(data as any)
            if (res.success) {
                setMessage({ type: 'success', text: 'Perfil actualizado correctamente' })
                await update()
            } else {
                setMessage({ type: 'error', text: res.error || 'Error al actualizar' })
            }
        })
    }

    return (
        <div className="max-w-5xl mx-auto space-y-10 pb-20">
            <PageHeader 
                title="Gestión de Perfil" 
                description="Personaliza tu información y seguridad en Belorama"
            />

            {message && (
                <div className={`p-4 rounded-3xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 ${message.type === 'success' ? 'bg-[#1D9E75]/10 text-[#1D9E75] border border-[#1D9E75]/20' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                    {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <p className="text-xs font-black uppercase tracking-tight">{message.text}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Lado Izquierdo: Resumen y Foto */}
                <div className="space-y-8">
                    <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-xl shadow-gray-200/30 flex flex-col items-center text-center">
                        <div className="relative group">
                            <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden bg-[#EF9F27]/10 border-4 border-white shadow-2xl relative flex items-center justify-center text-[#EF9F27] font-black text-5xl">
                                {getInitials(userData.nombre)}
                            </div>
                        </div>

                        <div className="mt-8 space-y-1">
                            <h2 className="text-xl font-black text-[#072E1F] tracking-tight">{userData.nombre} {userData.apellidoPaterno}</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{userData.role?.name || 'Residente'}</p>
                        </div>

                        <div className="mt-8 w-full pt-8 border-t border-gray-50 grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <p className="text-lg font-black text-[#072E1F]">DNI</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{userData.dni || 'S/N'}</p>
                            </div>
                            {userData.residente?.habitacion && (
                                <div className="text-center border-l border-gray-50">
                                    <p className="text-lg font-black text-[#1D9E75]">Hab. {userData.residente.habitacion.numero}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Piso {userData.residente.habitacion.piso}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {userData.residente?.pagos && userData.residente.pagos.length > 0 && (
                        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-gray-200/20">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Resumen de Pagos</h3>
                            <div className="space-y-4">
                                {userData.residente.pagos.slice(0, 3).map((pago: any) => (
                                    <div key={pago.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                        <div className="text-[11px] font-bold text-gray-600 uppercase tracking-tight">{pago.concepto}</div>
                                        <div className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                                            pago.estado === 'PAGADO' ? 'bg-green-100 text-green-600' : 
                                            pago.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                                        }`}>
                                            {pago.estado}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-[#072E1F] rounded-[3rem] p-8 text-white shadow-xl shadow-gray-900/10">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                <ShieldCheck size={20} className="text-[#1D9E75]" />
                            </div>
                            <h3 className="font-black text-sm uppercase tracking-widest">Seguridad</h3>
                        </div>
                        <p className="text-xs text-white/60 leading-relaxed font-medium">
                            Tu información está protegida. Asegúrate de usar una contraseña fuerte que no compartas con nadie más.
                        </p>
                    </div>
                </div>

                {/* Centro: Formularios */}
                <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-8">
                    {/* Información Principal */}
                    <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-xl shadow-gray-200/30">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-[#1D9E75]">
                                <User size={24} />
                            </div>
                            <h3 className="text-lg font-black text-[#072E1F] tracking-tight">Datos Personales</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                    <User size={12} /> Nombres
                                </label>
                                <input name="nombre" defaultValue={userData.nombre} className="w-full px-6 py-4 rounded-2xl border border-gray-50 bg-gray-50/20 focus:bg-white focus:border-[#1D9E75] outline-none transition-all font-bold text-gray-700" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                    <User size={12} /> Apellido Paterno
                                </label>
                                <input name="apellidoPaterno" defaultValue={userData.apellidoPaterno} className="w-full px-6 py-4 rounded-2xl border border-gray-50 bg-gray-50/20 focus:bg-white focus:border-[#1D9E75] outline-none transition-all font-bold text-gray-700" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                    <User size={12} /> Apellido Materno
                                </label>
                                <input name="apellidoMaterno" defaultValue={userData.apellidoMaterno} className="w-full px-6 py-4 rounded-2xl border border-gray-50 bg-gray-50/20 focus:bg-white focus:border-[#1D9E75] outline-none transition-all font-bold text-gray-700" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                    <Mail size={12} /> Correo Electrónico
                                </label>
                                <input name="email" type="email" value={userData.email} disabled className="w-full px-6 py-4 rounded-2xl border border-gray-50 bg-gray-50/10 text-gray-400 font-bold opacity-70 cursor-not-allowed" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                    <Phone size={12} /> Teléfono Móvil
                                </label>
                                <input name="telefono" defaultValue={userData.telefono} className="w-full px-6 py-4 rounded-2xl border border-gray-50 bg-gray-50/20 focus:bg-white focus:border-[#1D9E75] outline-none transition-all font-bold text-gray-700" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                    <Calendar size={12} /> Fecha de Nacimiento
                                </label>
                                <input name="fechaNacimiento" type="date" defaultValue={userData.fechaNacimiento ? new Date(userData.fechaNacimiento).toISOString().split('T')[0] : ''} className="w-full px-6 py-4 rounded-2xl border border-gray-50 bg-gray-50/20 focus:bg-white focus:border-[#1D9E75] outline-none transition-all font-bold text-gray-700" />
                            </div>
                        </div>
                    </div>

                    {/* Contacto de Emergencia */}
                    <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-xl shadow-gray-200/30">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
                                <HeartPulse size={24} />
                            </div>
                            <h3 className="text-lg font-black text-[#072E1F] tracking-tight">Contacto de Emergencia</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Nombre Completo</label>
                                <input name="emergenciaNombre" defaultValue={userData.emergenciaNombre} placeholder="Nombre del contacto" className="w-full px-6 py-4 rounded-2xl border border-gray-50 bg-gray-50/20 focus:bg-white focus:border-[#1D9E75] outline-none transition-all font-bold text-gray-700" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Teléfono Directo</label>
                                <input name="emergenciaTelefono" defaultValue={userData.emergenciaTelefono} placeholder="999 000 111" className="w-full px-6 py-4 rounded-2xl border border-gray-50 bg-gray-50/20 focus:bg-white focus:border-[#1D9E75] outline-none transition-all font-bold text-gray-700" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Parentesco</label>
                                <input name="emergenciaParentesco" defaultValue={userData.emergenciaParentesco} placeholder="Madre, Padre, etc." className="w-full px-6 py-4 rounded-2xl border border-gray-50 bg-gray-50/20 focus:bg-white focus:border-[#1D9E75] outline-none transition-all font-bold text-gray-700" />
                            </div>
                        </div>
                    </div>

                    {/* Salud y Nutrición - Solo para Residentes */}
                    {userData.residente && (
                        <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-xl shadow-gray-200/30">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-12 h-12 bg-[#EF9F27]/10 rounded-2xl flex items-center justify-center text-[#EF9F27]">
                                    <HeartPulse size={24} />
                                </div>
                                <h3 className="text-lg font-black text-[#072E1F] tracking-tight">Salud y Nutrición</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Alergias</label>
                                    <input 
                                        name="alergias" 
                                        defaultValue={userData.residente?.alergias} 
                                        placeholder="Ej. Penicilina, Maní..." 
                                        autoComplete="off"
                                        className="w-full px-6 py-4 rounded-2xl border border-gray-50 bg-gray-50/20 focus:bg-white focus:border-[#1D9E75] outline-none transition-all font-bold text-gray-700" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Restricciones Alimentarias</label>
                                    <input 
                                        name="restriccionesAlimentarias" 
                                        defaultValue={userData.residente?.restriccionesAlimentarias} 
                                        placeholder="Ej. Vegano, Sin lactosa..." 
                                        autoComplete="off"
                                        className="w-full px-6 py-4 rounded-2xl border border-gray-50 bg-gray-50/20 focus:bg-white focus:border-[#1D9E75] outline-none transition-all font-bold text-gray-700" 
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Cambio de Contraseña */}
                    <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-xl shadow-gray-200/30">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 bg-[#1D9E75]/10 rounded-2xl flex items-center justify-center text-[#1D9E75]">
                                <Lock size={24} />
                            </div>
                            <h3 className="text-lg font-black text-[#072E1F] tracking-tight">Cambiar Contraseña</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Nueva Contraseña</label>
                                <input name="password" type="password" placeholder="••••••••" autoComplete="new-password" className="w-full px-6 py-4 rounded-2xl border border-gray-50 bg-gray-50/20 focus:bg-white focus:border-[#1D9E75] outline-none transition-all font-bold text-gray-700" />
                            </div>
                            <div className="space-y-2 flex items-end">
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="w-full bg-[#1D9E75] hover:bg-[#072E1F] text-white h-[60px] rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#1D9E75]/20 disabled:opacity-50"
                                >
                                    {isPending ? 'Actualizando...' : <><Save size={18} /> Guardar Perfil</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
