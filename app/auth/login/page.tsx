'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

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
            if (res.error.includes('Cuenta inactiva')) {
                setError('Tu cuenta está inactiva o ha sido desactivada.')
            } else if (res.error.includes('AccessDenied')) {
                setError('Acceso denegado. Contacta con soporte.')
            } else {
                setError('Credenciales incorrectas. Verifícalas y vuelve a intentarlo.')
            }
            setLoading(false)
            return
        }

        router.push('/auth/success')
        router.refresh()
    }

    if (!mounted) return <div className="min-h-screen bg-[#072E1F]" />

    return (
        <div className="min-h-screen flex w-full bg-[#072E1F] sm:bg-[#F4F6F4]" suppressHydrationWarning>
            {/* Mitad Izquierda Formulario (Left Side) */}
            <div className="flex flex-col flex-1 shadow-none sm:shadow-2xl overflow-hidden bg-white z-10 w-full sm:rounded-r-[2.5rem] lg:w-5/12 xl:w-1/3 relative shrink-0">

                {/* Header Móvil */}
                <div className="flex items-center justify-between p-6 sm:p-8 shrink-0">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-gray-400 hover:text-[#1D9E75] transition-all group"
                    >
                        <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-[#1D9E75]/10 border border-gray-100">
                            <ArrowLeft size={18} />
                        </div>
                    </Link>
                    <h1 className="text-xl font-black tracking-widest text-[#1D9E75] uppercase">Grow Residencial</h1>
                    <div className="w-10"></div> {/* Spacer to center logo */}
                </div>

                <div className="w-full flex-1 flex flex-col justify-center px-8 pb-10 sm:px-14">
                    <div className="w-full max-w-[380px] mx-auto space-y-6">
                        {/* Header Text */}
                        <div className="space-y-2 text-center sm:text-left">
                            <h2 className="text-3xl font-black tracking-tight text-[#072E1F]">¡Hola de nuevo!</h2>
                            <p className="text-sm text-gray-400 font-medium leading-relaxed italic">Ingresa tus credenciales para acceder.</p>
                        </div>

                        {/* Formulario */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Correo Electrónico</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                        </svg>
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="tu@email.com"
                                        required
                                        className="pl-[3rem] w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Contraseña</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="pl-[3rem] w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            {/* Mostrar Error */}
                            {error && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl animate-in fade-in zoom-in-95 duration-300">
                                    <p className="text-xs font-bold text-red-700">{error}</p>
                                </div>
                            )}

                            <div className="flex items-center justify-between text-xs py-2">
                                <label className="flex items-center text-gray-400 font-bold cursor-pointer group uppercase tracking-widest">
                                    <input type="checkbox" className="rounded text-[#1D9E75] focus:ring-[#1D9E75] bg-gray-50 border-gray-300 w-4 h-4 cursor-pointer" />
                                    <span className="ml-2 group-hover:text-gray-900 transition-colors">Recordarme</span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-2xl shadow-xl shadow-green-900/10 text-sm font-black uppercase tracking-widest text-white transition-all bg-[#1D9E75] hover:bg-[#085041] hover:shadow-2xl active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed group"
                            >
                                {loading ? 'Ingresando...' : (
                                    <>
                                        Entrar al Sistema
                                        <svg className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </form>


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
                    <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                        La forma <span className="text-[#EF9F27]">inteligente</span> de gestionar tu residencia.
                    </h1>
                    <p className="text-lg text-gray-200 leading-relaxed font-light">
                        Una experiencia fluida y conectada. Cuartos, lavandería, finanzas y comida, todo en un solo lugar.
                    </p>


                </div>
            </div>
        </div>
    )
}