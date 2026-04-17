'use client'

import { useState, useTransition } from 'react'
import { Plus, User, Edit2, Trash2, Mail, Shield, Building, Save, X, Loader2, Users } from 'lucide-react'
import { upsertUsuario, eliminarUsuario } from '@/app/actions/usuarios'

interface StaffMember {
    id: number
    nombre: string
    email: string
    role: { id: number, name: string }
    residencia?: { nombre: string } | null
    residenciaId?: number | null
}

export function StaffManager({ staff, roles, residencias }: { staff: StaffMember[], roles: any[], residencias: any[] }) {
    const [isPending, startTransition] = useTransition()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingMember, setEditingMember] = useState<StaffMember | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleSave = async (formData: FormData) => {
        setError(null)
        const data = {
            id: editingMember?.id,
            nombre: formData.get('nombre'),
            email: formData.get('email'),
            password: formData.get('password'),
            roleId: formData.get('roleId'),
            residenciaId: formData.get('residenciaId')
        }

        startTransition(async () => {
            const result = await upsertUsuario(data)
            if (result.success) {
                setIsModalOpen(false)
                setEditingMember(null)
            } else {
                setError(result.error as string)
            }
        })
    }

    const handleDelete = async (id: number) => {
        if (confirm('¿Estás seguro de eliminar a este miembro del equipo?')) {
            const result = await eliminarUsuario(id)
            if (!result.success) alert(result.error)
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center justify-between bg-white p-8 rounded-[3rem] border border-gray-100 shadow-2xl shadow-gray-200/50">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[2rem] bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                        <Users size={28} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-[#072E1F]">Gestión de Personal</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Colaboradores, cocineros y administradores.</p>
                    </div>
                </div>
                <button
                    onClick={() => { setEditingMember(null); setIsModalOpen(true); }}
                    className="flex items-center gap-3 bg-[#1D9E75] text-white px-8 py-4 rounded-2xl font-black hover:bg-[#085041] transition-all shadow-xl shadow-[#1D9E75]/20"
                >
                    <Plus size={18} />
                    Nuevo Miembro
                </button>
            </div>

            {/* Staff Table */}
            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl shadow-gray-100/50 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="text-left px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Usuario</th>
                            <th className="text-left px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Rol</th>
                            <th className="text-left px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Asignación</th>
                            <th className="text-right px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 italic">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {staff.map((member) => (
                            <tr key={member.id} className="hover:bg-indigo-50/20 transition-all group">
                                <td className="px-10 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                            {member.nombre.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-black text-[#072E1F]">{member.nombre}</p>
                                            <p className="text-xs font-medium text-gray-400">{member.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-10 py-6">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                        member.role.name === 'ADMIN' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-gray-100 text-gray-500 border-transparent'
                                    }`}>
                                        {member.role.name}
                                    </span>
                                </td>
                                <td className="px-10 py-6">
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                                        <Building size={12} className="text-gray-300" />
                                        {member.residencia?.nombre || 'General'}
                                    </div>
                                </td>
                                <td className="px-10 py-6 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => { setEditingMember(member); setIsModalOpen(true); }}
                                            className="p-3 bg-white border border-gray-100 text-gray-400 hover:text-indigo-600 hover:border-indigo-100 transition-all rounded-xl shadow-sm"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(member.id)}
                                            className="p-3 bg-white border border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-100 transition-all rounded-xl shadow-sm"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Upsert Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-[#072E1F]/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <form 
                        action={handleSave} 
                        className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl p-12 space-y-8 animate-in zoom-in-95 duration-500"
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black text-[#072E1F]">
                                {editingMember ? 'Editar Miembro' : 'Nuevo Miembro del Personal'}
                            </h2>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-100 transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        {error && (
                            <div className="p-5 bg-red-50 text-red-500 rounded-3xl text-sm font-bold border border-red-100">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2 col-span-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Nombre Completo</label>
                                <input name="nombre" defaultValue={editingMember?.nombre} required className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-[#1D9E75] outline-none font-bold text-gray-700 transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Email Acceso</label>
                                <input name="email" defaultValue={editingMember?.email} required type="email" className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-[#1D9E75] outline-none font-bold text-gray-500 transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Contraseña {editingMember && '(Opcional)'}</label>
                                <input name="password" required={!editingMember} type="password" placeholder={editingMember ? 'Dejar vacío para no cambiar' : '••••••••'} className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-[#1D9E75] outline-none font-bold text-gray-700 transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Asignar Rol</label>
                                <select name="roleId" defaultValue={editingMember?.role.id} required className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-[#1D9E75] outline-none font-black text-gray-700 transition-all appearance-none cursor-pointer">
                                    {roles.filter(r => r.name !== 'RESIDENTE').map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Asignar Sede</label>
                                <select name="residenciaId" defaultValue={editingMember?.residenciaId || ''} className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-[#1D9E75] outline-none font-black text-gray-700 transition-all appearance-none cursor-pointer">
                                    <option value="">Todas (Global)</option>
                                    {residencias.map(res => (
                                        <option key={res.id} value={res.id}>{res.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-50 flex justify-end gap-4">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-all">Cancelar</button>
                            <button type="submit" disabled={isPending} className="px-10 py-4 bg-[#1D9E75] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#1D9E75]/20 flex items-center gap-3 active:scale-95 transition-all disabled:opacity-50">
                                {isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                {editingMember ? 'Actualizar' : 'Crear Miembro'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}
