'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const res = await signIn('credentials', {
            email,
            password,
            redirect: false,
        })

        if (res?.error) {
            setError('Credenciales incorrectas. Verifícalas y vuelve a intentarlo.')
            setLoading(false)
            return
        }

        router.push('/auth/success')
        router.refresh()
    }

    return (
        <div className="min-h-screen flex w-full bg-[#072E1F] sm:bg-[#F4F6F4]">
            {/* Mitad Izquierda Formulario (Left Side) */}
            <div className="flex flex-col flex-1 shadow-none sm:shadow-2xl overflow-hidden bg-white z-10 w-full sm:rounded-r-[2.5rem] lg:w-5/12 xl:w-1/3 relative shrink-0">
                <div className="w-full flex-1 flex flex-col justify-center p-8 sm:p-12 md:p-14 relative">
                    <div className="w-full max-w-[380px] mx-auto space-y-8 relative z-10">
                        {/* Logo & Header */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-[#1D9E75] rounded-xl flex items-center justify-center shadow-lg shadow-[#1D9E75]/30">
                                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Belorama</h1>
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight text-gray-900">¡Hola de nuevo!</h2>
                            <p className="text-sm text-gray-500 font-medium">Ingresa tus credenciales para acceder a tu cuenta centralizada.</p>
                        </div>

                        {/* Formulario */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">Correo Electrónico</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                        </svg>
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="tu@email.com"
                                        required
                                        className="pl-[2.75rem] w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">Contraseña</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="pl-[2.75rem] w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            {/* Mostrar Error */}
                            {error && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md animate-in fade-in zoom-in-95 duration-300">
                                    <div className="flex items-center">
                                        <svg className="h-5 w-5 text-red-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        <p className="ml-3 text-sm text-red-700">{error}</p>
                                    </div>
                                </div>
                            )}

                            {/* Guardar Sesión & Olvide Contraseña */}
                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center text-gray-600 font-medium cursor-pointer group">
                                    <input type="checkbox" className="rounded text-[#1D9E75] focus:ring-[#1D9E75] bg-gray-50 border-gray-300 w-4 h-4 cursor-pointer" />
                                    <span className="ml-2 group-hover:text-gray-900 transition-colors">Recordarme</span>
                                </label>
                                <button type="button" className="font-semibold text-[#1D9E75] hover:text-[#085041] transition-colors focus:outline-none focus:underline">
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white transition-all bg-[#1D9E75] hover:bg-[#085041] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D9E75] disabled:opacity-70 disabled:cursor-not-allowed group"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Ingresando...
                                    </>
                                ) : (
                                    <>
                                        Iniciar Sesión
                                        <svg className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Hint de cuentas (Solo para que sea fácil en la demo) */}
                    <div className="mt-8 pt-6 border-t border-gray-100 max-w-[380px] mx-auto w-full">
                        <h3 className="text-sm font-semibold text-gray-500 mb-3 text-center uppercase tracking-wider">Accesos de Prueba</h3>
                        <div className="grid grid-cols-1 gap-2 text-xs text-gray-600 bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                            <div className="flex justify-between items-center"><span className="font-medium text-gray-800">Admin</span> <code>admin@belorama.com</code></div>
                            <div className="flex justify-between items-center"><span className="font-medium text-gray-800">Cocinero</span> <code>cocinero@belorama.com</code></div>
                            <div className="flex justify-between items-center"><span className="font-medium text-gray-800">Residente</span> <code>ana@belorama.com</code></div>
                            <div className="mt-3 pt-3 border-t border-gray-200 text-center text-gray-400"> Passwords por defecto: <code className="text-[#1D9E75] font-bold">admin123</code> <code className="text-[#1D9E75] font-bold">cocina123</code> <code className="text-[#1D9E75] font-bold">res123</code></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mitad Derecha (Background) - Oculto en móvil */}
            <div className="hidden sm:flex flex-1 relative bg-[#072E1F] items-center justify-center p-12 overflow-hidden">
                <div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 hover:scale-105"
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=2069&auto=format&fit=crop')" }}
                ></div>
                <div className="absolute inset-0 bg-[#072E1F]/50 mix-blend-multiply"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#072E1F] via-transparent to-transparent"></div>

                <div className="relative z-10 max-w-lg text-white space-y-6 mt-32">
                    <span className="inline-block py-1.5 px-3.5 rounded-full bg-[#EF9F27]/20 backdrop-blur-sm text-[#EF9F27] border border-[#EF9F27]/30 text-sm font-bold tracking-wider">
                        SISTEMA DE GESTIÓN V2
                    </span>
                    <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                        La forma <span className="text-[#EF9F27]">inteligente</span> de gestionar tu residencia.
                    </h1>
                    <p className="text-lg text-gray-200 leading-relaxed font-light">
                        Una experiencia fluida y conectada. Administra cuartos, lavandería, finanzas y comida, todo en un solo lugar.
                    </p>
                    
                    {/* Widget Decorativo */}
                    <div className="mt-12 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 shadow-2xl flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#1D9E75] rounded-full flex items-center justify-center shadow-lg shrink-0">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-bold text-white leading-tight">Plataforma 100% Sincronizada</p>
                            <p className="text-sm text-gray-300 font-medium">Actualizaciones de módulos en tiempo real.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}