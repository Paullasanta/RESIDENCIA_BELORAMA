'use client'

import { useState, useEffect } from 'react'
import { 
    Database, HardDrive, ShieldCheck, Activity, 
    Users, Building2, CreditCard, ShoppingBag, 
    Settings, Image as ImageIcon, ExternalLink, RefreshCw
} from 'lucide-react'
import { getSystemStats, getStorageAudit, deleteModelImage } from '@/app/actions/technical'

export function SystemTechnical() {
    const [stats, setStats] = useState<any>(null)
    const [storage, setStorage] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

    const loadData = async () => {
        setLoading(true)
        try {
            const [s, st] = await Promise.all([getSystemStats(), getStorageAudit()])
            setStats(s)
            setStorage(st)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteImage = async (id: number, model: string, url: string) => {
        if (!confirm('¿Seguro que quieres borrar esta imagen de la base de datos?')) return
        try {
            await deleteModelImage(id, model, url)
            loadData() // Recargar para ver cambios
        } catch (error) {
            alert('Error al borrar imagen')
        }
    }

    useEffect(() => { loadData() }, [])

    if (loading) return <div className="p-12 text-center animate-pulse font-black text-[#1D9E75]">CARGANDO PANEL TÉCNICO...</div>

    const cpanelItems = [
        { id: 'usuarios', label: 'Usuarios', count: stats?.users, icon: <Users size={32} />, color: 'bg-blue-500' },
        { id: 'residencias', label: 'Residencias', count: stats?.residencias, icon: <Building2 size={32} />, color: 'bg-emerald-500' },
        { id: 'pagos', label: 'Pagos/Cobros', count: stats?.pagos, icon: <CreditCard size={32} />, color: 'bg-amber-500' },
        { id: 'productos', label: 'Marketplace', count: stats?.productos, icon: <ShoppingBag size={32} />, color: 'bg-purple-500' },
        { id: 'configs', label: 'Configuración', count: stats?.configs, icon: <Settings size={32} />, color: 'bg-slate-700' },
        { id: 'roles', label: 'Permisos/Roles', count: stats?.roles, icon: <ShieldCheck size={32} />, color: 'bg-red-500' },
    ]

    return (
        <div className="space-y-12 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Header CPanel Style */}
            <div className="bg-[#072E1F] p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
                    <Database size={200} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h2 className="text-3xl font-black tracking-tighter mb-2 uppercase">Root Control Center</h2>
                        <p className="text-white/70 font-medium">Gestión técnica y auditoría profunda de la base de datos.</p>
                    </div>
                    <button 
                        onClick={loadData}
                        className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl transition-all flex items-center gap-2 font-bold backdrop-blur-md"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                        Actualizar Datos
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {cpanelItems.map((item, idx) => (
                    <button 
                        key={idx} 
                        onClick={() => setSelectedCategory(item.id)}
                        className={`group p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all border flex flex-col items-center text-center gap-3 ${
                            selectedCategory === item.id ? 'bg-[#072E1F] text-white border-transparent' : 'bg-white text-gray-900 border-gray-100'
                        }`}
                    >
                        <div className={`${item.color} p-4 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform`}>
                            {item.icon}
                        </div>
                        <div>
                            <p className={`text-[10px] font-black uppercase tracking-widest ${selectedCategory === item.id ? 'text-white/50' : 'text-gray-400'}`}>
                                {item.label}
                            </p>
                            <p className="text-2xl font-black">{item.count}</p>
                        </div>
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="p-8 rounded-3xl border-none shadow-xl bg-white overflow-hidden relative">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600">
                                <HardDrive size={24} />
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tight">
                                {selectedCategory ? `Audit: ${selectedCategory}` : 'Auditoría General'}
                            </h3>
                        </div>
                        {selectedCategory && (
                            <button onClick={() => setSelectedCategory(null)} className="text-xs font-bold text-gray-400 hover:text-gray-600 uppercase underline">Ver Todo</button>
                        )}
                    </div>

                    <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {storage && Object.entries(storage)
                            .filter(([key]) => !selectedCategory || key.toLowerCase().includes(selectedCategory.toLowerCase()))
                            .map(([key, items]: [string, any]) => (
                                <div key={key} className="space-y-3">
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-1">{key}</h4>
                                    {items.map((item: any, i: number) => (
                                        <div key={i} className="flex flex-col gap-1 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                            <p className="text-sm font-bold text-gray-800">{item.name}</p>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {item.urls.map((url: string, j: number) => (
                                                    <div key={j} className="flex items-center gap-1">
                                                        <a 
                                                            href={url} 
                                                            target="_blank" 
                                                            className="flex items-center gap-1 text-[10px] bg-white px-2 py-1 rounded-lg border border-gray-200 hover:border-indigo-400 text-indigo-600 font-bold truncate max-w-[150px]"
                                                        >
                                                            <ImageIcon size={10} />
                                                            Ver {j + 1}
                                                        </a>
                                                        <button 
                                                            onClick={() => handleDeleteImage(item.id, item.model, url)}
                                                            className="p-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
                                                            title="Borrar imagen de la BD"
                                                        >
                                                            <RefreshCw size={10} className="rotate-45" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                    </div>
                </div>
                <div className="p-8 rounded-3xl border-none shadow-xl bg-[#0F172A] text-white">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="bg-white/10 p-3 rounded-2xl text-cyan-400">
                            <Activity size={24} />
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-tight">Estado del Sistema</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                            <span className="text-sm font-bold opacity-70">Prisma Client</span>
                            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-black rounded-full uppercase">Connected</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                            <span className="text-sm font-bold opacity-70">Next.js Version</span>
                            <span className="text-sm font-mono font-bold text-cyan-400">16.2.3</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                            <span className="text-sm font-bold opacity-70">Autenticación</span>
                            <span className="text-sm font-mono font-bold text-cyan-400">NextAuth v5 Beta</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                            <span className="text-sm font-bold opacity-70">VPS Server</span>
                            <span className="text-sm font-mono font-bold text-cyan-400">Hostinger - Ubuntu</span>
                        </div>
                    </div>

                    <div className="mt-8 p-6 bg-red-500/10 rounded-3xl border border-red-500/20">
                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">Zona de Peligro (Root Powers)</p>
                        <p className="text-xs opacity-70 mb-4 font-medium">Estas acciones afectan la base de datos de producción de forma irreversible.</p>
                        
                        <div className="space-y-2">
                            <button 
                                onClick={() => { if(confirm('¿BORRAR TODO? Esta acción limpiará todas las tablas excepto roles y el admin maestro.')) alert('Acción de limpieza total simulada (requiere script de base de datos)') }}
                                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-black text-xs transition-colors uppercase tracking-widest shadow-lg shadow-red-500/30"
                            >
                                PURGAR BASE DE DATOS TOTAL
                            </button>
                            <button 
                                onClick={() => alert('Generando backup JSON... (Función de descarga en desarrollo)')}
                                className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-black text-xs transition-colors uppercase tracking-widest"
                            >
                                DESCARGAR BACKUP COMPLETO (JSON)
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Export & Audit Tools */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h3 className="text-xl font-black text-[#072E1F] uppercase tracking-tighter">Exportación Profesional</h3>
                    <p className="text-sm text-gray-500 font-medium">Descarga reportes técnicos detallados de la infraestructura.</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">Exportar URLs Imágenes</button>
                    <button className="px-6 py-3 bg-[#072E1F] text-white hover:bg-black rounded-2xl text-xs font-black uppercase tracking-widest transition-all">Reporte Usuarios PDF</button>
                </div>
            </div>
        </div>
    )
}
