import { auth } from '@/lib/auth'
import { PageHeader } from '@/components/shared/PageHeader'
import { Settings, ShieldCheck } from 'lucide-react'

export default async function ConfiguracionPage() {
    const session = await auth()

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <PageHeader
                title="Configuración"
                description="Información de tu cuenta de administrador."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-[#1D9E75]/10 rounded-xl flex items-center justify-center">
                            <ShieldCheck size={20} className="text-[#1D9E75]" />
                        </div>
                        <h2 className="text-lg font-bold text-[#072E1F]">Perfil de Administrador</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Nombre</label>
                            <p className="mt-1 text-gray-900 font-semibold">{session?.user.nombre}</p>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Correo</label>
                            <p className="mt-1 text-gray-900 font-semibold">{session?.user.email}</p>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Rol</label>
                            <p className="mt-1">
                                <span className="bg-[#072E1F] text-white text-xs font-bold px-2.5 py-1 rounded-full">
                                    {session?.user.rol}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                            <Settings size={20} className="text-gray-500" />
                        </div>
                        <h2 className="text-lg font-bold text-[#072E1F]">Sistema</h2>
                    </div>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between py-3 border-b border-gray-50">
                            <span className="text-gray-500">Versión</span>
                            <span className="font-semibold text-gray-800">Belorama v2.0</span>
                        </div>
                        <div className="flex justify-between py-3 border-b border-gray-50">
                            <span className="text-gray-500">Base de datos</span>
                            <span className="font-semibold text-green-600">Conectada ✓</span>
                        </div>
                        <div className="flex justify-between py-3">
                            <span className="text-gray-500">Autenticación</span>
                            <span className="font-semibold text-green-600">NextAuth v5 ✓</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
