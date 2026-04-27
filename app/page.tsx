import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { MapPin, BedDouble, Users, ArrowRight, ShieldCheck, Sparkles, Building2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const session = await auth()

  const habitacionesLibres = await prisma.habitacion.findMany({
    where: { estado: 'LIBRE' },
    include: {
      residencia: true,
      publicacion: true
    }
  })

  const getDashboardUrl = () => {
    if (!session) return '/auth/login'
    const { rol } = session.user
    if (rol === 'ADMIN') return '/modules/dashboard'
    if (rol === 'RESIDENTE') return '/modules/dashboard'
    if (rol === 'COCINERO') return '/modules/comida'
    return '/modules/dashboard'
  }

  return (
    <div className="min-h-screen bg-[#F8FAF8] flex flex-col font-sans overflow-x-hidden">
      {/* Header Premium - Mobile Optimized */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-[100]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex justify-between h-16 sm:h-20 items-center">
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              <div className="w-9 h-9 sm:w-11 sm:h-11 bg-[#1D9E75] rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-[#1D9E75]/20">
                <span className="text-white font-black text-lg sm:text-xl">B</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl font-black text-[#072E1F] tracking-tighter leading-none">Belorama</span>
                <span className="hidden sm:inline text-[9px] font-bold text-[#1D9E75] uppercase tracking-widest mt-1">Housing & coliving</span>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-6">
              {session ? (
                <Link
                  href={getDashboardUrl()}
                  className="bg-[#072E1F] hover:bg-[#1D9E75] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all"
                >
                  <span className="hidden sm:inline">Acceder al Panel</span>
                  <span className="sm:hidden">Panel</span>
                </Link>
              ) : (
                <div className="flex items-center gap-3 sm:gap-4">
                  <Link href="/auth/login" className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Login
                  </Link>
                  <Link
                    href="#disponibilidad"
                    className="bg-[#1D9E75] hover:bg-[#072E1F] text-white px-4 sm:px-7 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all"
                  >
                    Reserva
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Mobile Optimized */}
      <main className="flex-1">
        <section className="relative pt-10 sm:pt-20 pb-6 sm:pb-10 overflow-hidden px-4">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-10 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-10 sm:gap-16">
              <div className="flex-1 text-center space-y-6 sm:space-y-8">
                <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black text-[#072E1F] leading-[1.1] sm:leading-[0.95] tracking-tighter">
                  Vive con Estilo, <br className="hidden sm:block" />
                  <span className="text-[#1D9E75]">Gestiona con Facilidad.</span>
                </h1>

                <p className="text-sm sm:text-lg text-gray-500 font-medium max-w-xl mx-auto text-center leading-relaxed px-4 sm:px-0">
                  Explora las habitaciones disponibles en nuestras residencias. Disfruta de un ambiente cómodo, seguro y diseñado para ti.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Habitaciones Disponibles - Dynamic Grid */}
        <section id="disponibilidad" className="bg-white py-16 sm:py-24 rounded-t-[2.5rem] sm:rounded-t-[4rem] shadow-2xl shadow-[#072E1F]/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
              <div className="space-y-3 sm:space-y-4">
                <h2 className="text-3xl sm:text-4xl font-black text-[#072E1F] tracking-tighter">Habitaciones Disponibles</h2>
                <p className="text-sm sm:text-gray-400 font-medium">Encuentra el espacio que mejor se adapte a tu ritmo de vida.</p>
              </div>
              <div className="inline-flex w-fit items-center gap-2 text-[9px] sm:text-[10px] font-black text-[#1D9E75] uppercase tracking-widest bg-[#1D9E75]/5 px-4 py-2 rounded-xl">
                <Building2 size={13} />
                {habitacionesLibres.length} Espacios listos hoy
              </div>
            </div>

            {habitacionesLibres.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                {habitacionesLibres.map((habitacion) => {
                  const mainImage =
                    (habitacion.publicacion?.fotos && habitacion.publicacion.fotos.length > 0) ? habitacion.publicacion.fotos[0] :
                      (habitacion.fotos && habitacion.fotos.length > 0) ? habitacion.fotos[0] :
                        (habitacion.residencia.fotos && habitacion.residencia.fotos.length > 0) ? habitacion.residencia.fotos[0] :
                          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

                  return (
                    <Link
                      key={habitacion.id}
                      href={`/habitacion/${habitacion.id}`}
                      className="group bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden hover:scale-[1.02] transition-all duration-500 block cursor-pointer"
                    >
                      <div className="relative aspect-[16/11] sm:aspect-[16/10]">
                        <img
                          src={mainImage}
                          alt={habitacion.numero}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-white/90 backdrop-blur-md text-[#1D9E75] text-[9px] sm:text-[10px] font-black px-3 sm:px-4 py-1.5 rounded-full uppercase tracking-widest shadow-xl">
                          S/ {habitacion.publicacion?.id ? 'Precio Web' : 'S/850'}
                        </div>
                      </div>

                      <div className="p-6 sm:p-8">
                        <div className="flex items-center gap-2 text-[8px] sm:text-[9px] font-black text-[#1D9E75] uppercase tracking-[0.2em] mb-2 sm:mb-3">
                          <MapPin size={10} />
                          {habitacion.residencia.nombre}
                        </div>

                        <h3 className="text-xl sm:text-2xl font-black text-[#072E1F] mb-3 sm:mb-4 group-hover:text-[#1D9E75] transition-colors leading-none">
                          Hab. {habitacion.numero}
                        </h3>

                        <div className="flex items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <Users size={14} className="sm:w-4 sm:h-4" />
                            <span className="text-[10px] sm:text-xs font-bold">{habitacion.capacidad} Pers.</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <BedDouble size={14} className="sm:w-4 sm:h-4" />
                            <span className="text-[10px] sm:text-xs font-bold">Nivel {habitacion.piso}</span>
                          </div>
                        </div>

                        <div className="w-full bg-gray-50 group-hover:bg-[#072E1F] text-gray-400 group-hover:text-white py-3.5 sm:py-4 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                          Ver Habitacion
                          <ArrowRight size={14} />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-16 sm:py-24 bg-gray-50/50 rounded-[2rem] sm:rounded-[3rem] border border-gray-100 border-dashed mx-4">
                <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
                  <BedDouble className="w-8 h-8 sm:w-10 sm:h-10 text-gray-200" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-[#072E1F]">Plazas Reservadas</h3>
                <p className="text-xs sm:text-gray-400 max-w-sm mx-auto mt-2 font-medium px-6">
                  Nuestro coliving está al máximo. ¡Déjanos tu contacto para avisarte en cuanto se libere una habitación!
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer - Mobile Optimized */}
      <footer className="bg-[#072E1F] text-white pt-16 sm:pt-24 pb-8 sm:pb-12 rounded-t-[2.5rem] sm:rounded-t-[4rem]">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 sm:gap-16 mb-16 sm:mb-20">
            <div className="max-w-xs space-y-4 sm:space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#1D9E75] rounded-xl flex items-center justify-center">
                  <span className="font-black text-lg">B</span>
                </div>
                <span className="text-xl sm:text-2xl font-black tracking-tighter">Belorama</span>
              </div>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                Redefiniendo la gestión residencial para la nueva generación de coliving.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-12 sm:gap-x-20 gap-y-10 w-full sm:w-auto">
              <div className="space-y-3 sm:space-y-4">
                <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#1D9E75]">Explorar</h4>
                <ul className="text-xs sm:text-sm text-gray-400 space-y-2">
                  <li>Habitaciones</li>
                  <li>Residencias</li>
                </ul>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#1D9E75]">Soporte</h4>
                <ul className="text-xs sm:text-sm text-gray-400 space-y-2">
                  <li>Ayuda</li>
                  <li>Contacto</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-8 sm:pt-10 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
            <p className="text-[8px] sm:text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] text-center sm:text-left">
              &copy; {new Date().getFullYear()} Belorama &middot; Crafted with Excellence
            </p>
            <div className="hidden sm:flex items-center gap-6">
              <ShieldCheck className="text-[#1D9E75]/50" size={18} />
              <span className="text-[10px] font-black text-white/30 uppercase">Secure Platform</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}