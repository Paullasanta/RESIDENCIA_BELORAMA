'use client'

import { useState } from 'react'
import { Settings, Users, ShieldCheck, LayoutGrid, Database } from 'lucide-react'

interface ConfigTabsProps {
    sistema: React.ReactNode
    personal: React.ReactNode
    roles: React.ReactNode
    tecnico?: React.ReactNode
    isSuperAdmin?: boolean
}

export function ConfigTabs({ sistema, personal, roles, tecnico, isSuperAdmin }: ConfigTabsProps) {
    const [activeTab, setActiveTab] = useState<'SISTEMA' | 'PERSONAL' | 'ROLES' | 'TECNICO'>(isSuperAdmin ? 'TECNICO' : 'SISTEMA')

    const tabs = [
        { id: 'SISTEMA', label: 'Identidad', icon: <LayoutGrid size={18} />, desc: 'Branding y logo' },
        { id: 'PERSONAL', label: 'El Equipo', icon: <Users size={18} />, desc: 'Gestión de staff' },
        { id: 'ROLES', label: 'Seguridad', icon: <ShieldCheck size={18} />, desc: 'Roles y permisos' },
        ...(isSuperAdmin ? [{ id: 'TECNICO', label: 'Técnico', icon: <Database size={18} />, desc: 'Root CPanel' }] : []),
    ]

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-100">
                <div className="flex gap-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`group relative pb-8 px-6 transition-all ${
                                activeTab === tab.id 
                                ? 'text-[#072E1F]' 
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            <div className="flex flex-col items-center gap-3">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                                    activeTab === tab.id 
                                    ? 'bg-[#072E1F] text-white shadow-xl shadow-[#072E1F]/20 scale-110' 
                                    : 'bg-gray-50 text-gray-300 group-hover:bg-gray-100 group-hover:scale-105'
                                }`}>
                                    {tab.icon}
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">{tab.label}</p>
                                    <p className="text-[10px] font-bold text-gray-300 group-hover:text-gray-400 transition-colors uppercase tracking-widest">{tab.desc}</p>
                                </div>
                            </div>
                            
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 inset-x-0 h-1 bg-[#1D9E75] rounded-t-full shadow-[0_-2px_10px_rgba(29,158,117,0.5)]" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === 'SISTEMA' && <div key="sistema">{sistema}</div>}
                {activeTab === 'PERSONAL' && <div key="personal">{personal}</div>}
                {activeTab === 'ROLES' && <div key="roles">{roles}</div>}
                {activeTab === 'TECNICO' && <div key="tecnico">{tecnico}</div>}
            </div>
        </div>
    )
}
