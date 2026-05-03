'use client'

import { useState, useEffect } from 'react'
import { Settings, X, Edit3, Image as ImageIcon, Users, Trash2, UploadCloud, CheckCircle2 } from 'lucide-react'
import {
    updateHabitacion,
    uploadHabitacionFotos,
    deleteHabitacionFoto,
    getResidentesParaAsignar,
    assignResidenteToHabitacion
} from '@/app/actions/habitaciones'
import { confirmReserva, cancelReserva } from '@/app/actions/reservas'
import { useRouter } from 'next/navigation'
import { ReservaModal } from './ReservaModal'

export function ManageHabitacionModal({ habitacion }: { habitacion: any }) {
    const [isOpen, setIsOpen] = useState(false)
    const [activeTab, setActiveTab] = useState<'EDITAR' | 'FOTOS' | 'RESIDENTES'>('EDITAR')
    const [loading, setLoading] = useState(false)
    const [showReserva, setShowReserva] = useState(false)

    // Residentes state
    const [residentesLibres, setResidentesLibres] = useState<any[]>([])
    const router = useRouter()

    useEffect(() => {
        if (isOpen && activeTab === 'RESIDENTES') {
            getResidentesParaAsignar(habitacion.residenciaId).then(res => setResidentesLibres(res))
        }
    }, [isOpen, activeTab, habitacion.residenciaId])

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        const data = {
            numero: formData.get('numero') as string,
            piso: Number(formData.get('piso')),
            capacidad: Number(formData.get('capacidad')),
            estado: formData.get('estado') as any,
        }

        await updateHabitacion(habitacion.id, data)
        setLoading(false)
        router.refresh()
    }

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return
        setLoading(true)
        const formData = new FormData()
        Array.from(e.target.files).forEach(f => formData.append('fotos', f))

        await uploadHabitacionFotos(habitacion.id, habitacion.residenciaId, formData)
        setLoading(false)
        router.refresh()
    }

    const handleDeleteFoto = async (fotoUrl: string) => {
        setLoading(true)
        await deleteHabitacionFoto(habitacion.id, habitacion.residenciaId, fotoUrl)
        setLoading(false)
        router.refresh()
    }

    const handleAssign = async (residenteId: number, currentHab: number | null) => {
        // Toggle assignment: si el usuario hace click en alguien asignado a ESTA habitacion, lo libera.
        const target = currentHab === habitacion.id ? null : habitacion.id
        setLoading(true)
        await assignResidenteToHabitacion(residenteId, target, habitacion.residenciaId)
        await getResidentesParaAsignar(habitacion.residenciaId).then(res => setResidentesLibres(res))
        setLoading(false)
        router.refresh()
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="text-[10px] flex items-center gap-1.5 font-bold text-gray-500 hover:text-[#1D9E75] bg-gray-100 hover:bg-[#1D9E75]/10 px-3 py-1.5 rounded-lg uppercase tracking-widest transition-all"
            >
                <Settings size={14} /> Gestionar
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">

                        {/* Header */}
                        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-[#072E1F]">Habitación {habitacion.numero}</h2>
                                <p className="text-sm font-medium text-gray-500">Piso {habitacion.piso} • Capacidad: {habitacion.capacidad}</p>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-200 rounded-xl text-gray-400 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-100 px-6 pt-2 gap-4">
                            {[
                                { id: 'EDITAR', icon: <Edit3 size={16} />, label: 'Propiedades' },
                                { id: 'FOTOS', icon: <ImageIcon size={16} />, label: 'Fotos Visibles' },
                                { id: 'RESIDENTES', icon: <Users size={16} />, label: 'Asignar Residentes' },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-4 py-3 font-bold text-xs uppercase tracking-widest transition-all border-b-2 ${activeTab === tab.id
                                            ? 'border-[#1D9E75] text-[#1D9E75]'
                                            : 'border-transparent text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Content Area */}
                        <div className="p-8 overflow-y-auto flex-1 bg-white">

                            {/* TAB: EDITAR */}
                            {activeTab === 'EDITAR' && (
                                <form onSubmit={handleUpdate} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Número</label>
                                            <input name="numero" defaultValue={habitacion.numero} required className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-[#1D9E75] outline-none font-bold" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Piso</label>
                                            <input name="piso" type="number" defaultValue={habitacion.piso} required className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-[#1D9E75] outline-none font-bold" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Capacidad MÁX.</label>
                                            <input name="capacidad" type="number" defaultValue={habitacion.capacidad} required className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-[#1D9E75] outline-none font-bold" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Estado</label>
                                            <div className="relative">
                                                <select
                                                    name="estado"
                                                    defaultValue={habitacion.estado}
                                                    onChange={(e) => {
                                                        if (e.target.value === 'RESERVADO') {
                                                            setShowReserva(true)
                                                        }
                                                    }}
                                                    className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-[#1D9E75] outline-none font-bold appearance-none"
                                                >
                                                    <option value="LIBRE">Libre</option>
                                                    <option value="RESERVADO">Reservado</option>
                                                    {/* Ocultos para selección manual */}
                                                    {habitacion.estado === 'OCUPADO' && <option value="OCUPADO">Ocupado (Sistema)</option>}
                                                    {habitacion.estado === 'POR_LIBERARSE' && <option value="POR_LIBERARSE">Por Liberarse (Sistema)</option>}
                                                </select>
                                                {habitacion.estado === 'OCUPADO' && (
                                                    <p className="text-[9px] font-bold text-red-500 mt-1 uppercase tracking-tighter">* No se puede cambiar manualmente si está ocupada.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Si está reservada, mostrar aviso y opción de confirmar */}
                                    {habitacion.estado === 'RESERVADO' && (
                                        <div className="p-6 bg-orange-50 border border-orange-100 rounded-3xl space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xs font-black text-orange-700 uppercase tracking-widest">Información de Reserva</h4>
                                                <span className="px-2 py-0.5 bg-orange-200 text-orange-800 text-[8px] font-black rounded-md">PENDIENTE</span>
                                            </div>
                                            <p className="text-xs text-orange-600 font-medium">Esta habitación tiene una reserva activa. Puedes confirmarla para convertirla en un residente oficial.</p>
                                            <div className="flex flex-col gap-2">
                                                <button
                                                    type="button"
                                                    disabled={loading}
                                                    onClick={async () => {
                                                        if (confirm('¿Confirmar la ocupación de esta habitación? Se creará el perfil de residente automáticamente.')) {
                                                            setLoading(true)
                                                            const resId = habitacion.reservas?.find((r: any) => r.estado === 'PENDIENTE')?.id
                                                            if (resId) {
                                                                const res = await confirmReserva(resId)
                                                                if (res.success) {
                                                                    router.refresh()
                                                                    setIsOpen(false)
                                                                } else {
                                                                    alert('Error: ' + res.error)
                                                                }
                                                            }
                                                            setLoading(false)
                                                        }
                                                    }}
                                                    className="w-full py-3 bg-orange-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 disabled:opacity-50"
                                                >
                                                    {loading ? 'Procesando...' : 'Confirmar Ocupación'}
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={loading}
                                                    onClick={async () => {
                                                        if (confirm('¿Seguro que deseas eliminar esta reserva? Se borrarán los datos del solicitante y la habitación quedará LIBRE.')) {
                                                            setLoading(true)
                                                            const resId = habitacion.reservas?.find((r: any) => r.estado === 'PENDIENTE')?.id
                                                            if (resId) {
                                                                const res = await cancelReserva(resId)
                                                                if (res.success) {
                                                                    router.refresh()
                                                                    setIsOpen(false)
                                                                } else {
                                                                    alert('Error al cancelar: ' + res.error)
                                                                }
                                                            } else {
                                                                alert('No se encontró el ID de la reserva.')
                                                            }
                                                            setLoading(false)
                                                        }
                                                    }}
                                                    className="w-full py-2.5 bg-white border border-red-200 text-red-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all disabled:opacity-50"
                                                >
                                                    {loading ? 'Eliminando...' : 'Quitar Reserva (Eliminar)'}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <button type="submit" disabled={loading || habitacion.estado === 'OCUPADO'} className="w-full bg-[#072E1F] text-white px-6 py-4 rounded-2xl font-black text-xs shadow-xl shadow-[#072E1F]/20 hover:bg-[#0a412b] transition-all disabled:opacity-50 uppercase tracking-widest mt-4">
                                        {loading ? 'Guardando Cambios...' : 'Guardar Propiedades'}
                                    </button>
                                </form>
                            )}

                            {showReserva && (
                                <ReservaModal
                                    habitacion={habitacion}
                                    onClose={() => {
                                        setShowReserva(false)
                                        // Reset select if cancelled? No, router.refresh handles it
                                    }}
                                />
                            )}

                            {/* TAB: FOTOS */}
                            {activeTab === 'FOTOS' && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-center w-full relative">
                                        <label htmlFor={`foto-${habitacion.id}`} className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-3xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <UploadCloud className="w-8 h-8 mb-3 text-gray-400" />
                                                <p className="text-sm text-gray-500 font-bold"><span className="text-[#1D9E75]">Subir fotos de Hab. {habitacion.numero}</span> o soltar aquí</p>
                                                <p className="text-xs text-gray-400">JPG, PNG o WEBP</p>
                                            </div>
                                            <input id={`foto-${habitacion.id}`} type="file" className="hidden" multiple accept="image/*" onChange={handleUpload} disabled={loading} />
                                        </label>
                                        {loading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center font-bold text-sm text-[#1D9E75]">Subiendo...</div>}
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        {habitacion.fotos?.map((foto: string, i: number) => (
                                            <div key={i} className="relative group rounded-2xl overflow-hidden aspect-square border border-gray-100 bg-gray-50">
                                                <img src={foto} alt="Habitacion" className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => handleDeleteFoto(foto)}
                                                    className="absolute top-2 right-2 bg-red-500 text-white p-2 text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    {habitacion.fotos?.length === 0 && (
                                        <p className="text-center text-sm text-gray-400 font-medium pb-8 pt-4">No hay fotos subidas para esta habitación.</p>
                                    )}
                                </div>
                            )}

                            {/* TAB: RESIDENTES */}
                            {activeTab === 'RESIDENTES' && (
                                <div className="space-y-4">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Selecciona para asignar o desasignar de esta habitación</p>
                                    <div className="space-y-2">
                                        {residentesLibres.map(r => {
                                            const isAssignedHere = r.habitacionId === habitacion.id
                                            return (
                                                <div key={r.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isAssignedHere ? 'border-[#1D9E75] bg-[#1D9E75]/5' : 'border-gray-100 hover:border-gray-200 bg-gray-50/50'}`}>
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-white ${isAssignedHere ? 'bg-[#1D9E75]' : 'bg-gray-300'}`}>
                                                            {r.user.nombre.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-800">{r.user.nombre}</div>
                                                            <div className="text-xs text-gray-400 font-medium">
                                                                {r.habitacion ? `Actualmente en Hab. ${r.habitacion.numero}` : 'Sin asignación'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        disabled={loading}
                                                        onClick={() => handleAssign(r.id, r.habitacionId)}
                                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 ${isAssignedHere
                                                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                                : 'bg-[#072E1F] text-white hover:bg-[#0a412b]'
                                                            }`}
                                                    >
                                                        {isAssignedHere ? 'Retirar' : 'Asignar Aquí'}
                                                    </button>
                                                </div>
                                            )
                                        })}
                                        {residentesLibres.length === 0 && (
                                            <p className="text-center text-sm text-gray-400 font-medium py-8">No hay residentes registrados en tu sistema.</p>
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
