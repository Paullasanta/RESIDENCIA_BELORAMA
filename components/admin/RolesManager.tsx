'use client'

import { useState, useTransition } from 'react'
import { Shield, Plus, Info, Check, X, Loader2, Key } from 'lucide-react'
import { upsertRole, toggleRolePermission } from '@/app/actions/roles'

interface RoleData {
    id: number
    name: string
    description: string | null
    permissions: {
        permissionId: number
        permission: { key: string, description: string | null }
    }[]
}

interface PermissionData {
    id: number
    key: string
    description: string | null
}

export function RolesManager({ roles, allPermissions }: { roles: RoleData[], allPermissions: PermissionData[] }) {
    const [isPending, startTransition] = useTransition()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingRole, setEditingRole] = useState<RoleData | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleSaveRole = async (formData: FormData) => {
        const data = {
            id: editingRole?.id,
            name: (formData.get('name') as string).toUpperCase(),
            description: formData.get('description') as string
        }

        startTransition(async () => {
            const result = await upsertRole(data)
            if (result.success) {
                setIsModalOpen(false)
                setEditingRole(null)
            } else {
                setError(result.error as string)
            }
        })
    }

    const handleToggle = (roleId: number, permissionId: number) => {
        startTransition(async () => {
            await toggleRolePermission(roleId, permissionId)
        })
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Header / Intro */}
            <div className="flex items-center justify-between bg-white p-8 rounded-[3rem] border border-gray-100 shadow-2xl shadow-gray-200/50">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[2rem] bg-purple-50 text-purple-600 flex items-center justify-center shadow-inner">
                        <Shield size={28} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-[#072E1F]">Roles y Seguridad</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Define quién manda en cada módulo.</p>
                    </div>
                </div>
                <button
                    onClick={() => { setEditingRole(null); setIsModalOpen(true); }}
                    className="flex items-center gap-3 bg-[#072E1F] text-white px-8 py-4 rounded-2xl font-black hover:bg-black transition-all shadow-xl shadow-black/20"
                >
                    <Plus size={18} />
                    Crear Nuevo Rol
                </button>
            </div>

            {/* Permission Matrix */}
            <div className="bg-white rounded-[3.5rem] border border-gray-100 shadow-3xl shadow-gray-200/50 overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-50/80 backdrop-blur-sm border-b border-gray-100">
                            <th className="sticky left-0 bg-gray-50 z-10 text-left px-12 py-10 min-w-[300px]">
                                <div className="flex items-center gap-3 text-[#072E1F]">
                                    <Key size={18} className="text-[#1D9E75]" />
                                    <span className="text-xs font-black uppercase tracking-[0.3em]">Permiso / Acción</span>
                                </div>
                            </th>
                            {roles.map(role => (
                                <th key={role.id} className="text-center px-8 py-10 min-w-[150px]">
                                    <div className="flex flex-col items-center gap-1">
                                        <button 
                                            onClick={() => { setEditingRole(role); setIsModalOpen(true); }}
                                            className="text-xs font-black text-[#072E1F] hover:text-[#1D9E75] transition-colors uppercase tracking-widest"
                                        >
                                            {role.name}
                                        </button>
                                        <span className="text-[8px] font-bold text-gray-300 uppercase tracking-tighter line-clamp-1">{role.description || 'Sin descripción'}</span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {allPermissions.map((perm) => (
                            <tr key={perm.id} className="hover:bg-green-50/20 transition-all group">
                                <td className="sticky left-0 bg-white group-hover:bg-[#F0FAF7] z-10 px-12 py-8 transition-colors">
                                    <p className="text-xs font-black text-gray-700 uppercase tracking-widest mb-1">{perm.key}</p>
                                    <p className="text-[10px] font-medium text-gray-400 italic">
                                        {perm.description || 'Habilita acceso a funcionalidades específicas.'}
                                    </p>
                                </td>
                                {roles.map(role => {
                                    const hasPerm = role.permissions.some(rp => rp.permissionId === perm.id)
                                    return (
                                        <td key={role.id} className="text-center px-8 py-8">
                                            <button
                                                onClick={() => handleToggle(role.id, perm.id)}
                                                disabled={isPending}
                                                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all mx-auto border-2 ${
                                                    hasPerm 
                                                    ? 'bg-[#1D9E75] text-white border-transparent shadow-lg shadow-[#1D9E75]/30' 
                                                    : 'bg-white text-gray-100 border-gray-50 hover:border-gray-200'
                                                }`}
                                            >
                                                {hasPerm ? <Check size={20} strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-100" />}
                                                {isPending && <div className="absolute inset-0 bg-white/20 animate-pulse rounded-2xl" />}
                                            </button>
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Role Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-[#072E1F]/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <form 
                        action={handleSaveRole} 
                        className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl p-12 space-y-8 animate-in zoom-in-95 duration-500"
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black text-[#072E1F]">
                                {editingRole ? 'Editar Rol' : 'Nuevo Rol de Sistema'}
                            </h2>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-100 transition-all">
                                <X size={20} />
                            </button>
                        </div>
                        
                        {error && <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-xs font-bold">{error}</div>}

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Nombre del Rol</label>
                                <input name="name" defaultValue={editingRole?.name} placeholder="E.j. LIMPIEZA" required className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-[#1D9E75] outline-none font-black text-gray-700 transition-all uppercase" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Descripción corta</label>
                                <textarea name="description" defaultValue={editingRole?.description || ''} placeholder="Describe qué hace este rol en el sistema..." rows={3} className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-[#1D9E75] outline-none font-medium text-gray-500 transition-all resize-none" />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-50 flex justify-end gap-4">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-all">Cancelar</button>
                            <button type="submit" disabled={isPending} className="px-10 py-4 bg-[#072E1F] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-black/20 flex items-center gap-3 active:scale-95 transition-all">
                                {isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                Guardar Rol
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}
