import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { MapPin, BedDouble, Users, ArrowRight, ShieldCheck, Sparkles, Building2 } from 'lucide-react'

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
    if (rol === 'RESIDENTE') return '/modules/dashboard' // O a su vista principal
    if (rol === 'COCINERO') return '/modules/comida'
    return '/modules/dashboard'
  }

  return (
    <div className="min-h-screen bg-[#F8FAF8] flex flex-col font-sans">
      {/* Header Premium */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-[100]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-[#1D9E75] rounded-2xl flex items-center justify-center shadow-lg shadow-[#1D9E75]/20">
                <span className="text-white font-black text-xl">B</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black text-[#072E1F] tracking-tighter leading-none">Belorama</span>
                <span className="text-[9px] font-bold text-[#1D9E75] uppercase tracking-widest mt-1">Housing & coliving</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {session ? (
                <Link
                  href={getDashboardUrl()}
                  className="bg-[#072E1F] hover:bg-[#1D9E75] text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-[#072E1F]/10 flex items-center gap-3 group"
                >
                  Acceder al Panel
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <div className="flex items-center gap-4">
                  <Link href="/auth/login" className="text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-[#072E1F] transition-colors">
                    Login
                  </Link>
                  <Link
                    href="/auth/login"
                    className="bg-[#1D9E75] hover:bg-[#072E1F] text-white px-7 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-[#1D9E75]/20"
                  >
                    Reserva Ahora
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section Modernizada */}
      <main className="flex-1">
        <section className="relative pt-20 pb-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1 text-center lg:text-left space-y-8">
                <div className="inline-flex items-center gap-2 bg-[#1D9E75]/10 px-4 py-2 rounded-full border border-[#1D9E75]/20">
                  <Sparkles size={14} className="text-[#1D9E75]" />
                  <span className="text-[10px] font-black text-[#1D9E75] uppercase tracking-[0.2em]">Experiencia Residencial V2</span>
                </div>
                
                <h1 className="text-5xl lg:text-7xl font-black text-[#072E1F] leading-[0.95] tracking-tighter">
                  Vive con Estilo, <br />
                  <span className="text-[#1D9E75]">Gestiona con Facilidad.</span>
                </h1>
                
                <p className="text-lg text-gray-500 font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Descubre las mejores habitaciones en residencias exclusivas. Un sistema inteligente diseñado para que sólo te preocupes por disfrutar de tu hogar.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                   <div className="flex items-center gap-3 bg-white p-2 pl-4 rounded-3xl border border-gray-100 shadow-sm">
                      <div className="flex -space-x-3">
                         {[1,2,3].map(i => (
                           <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200"></div>
                         ))}
                      </div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">+500 Residentes felices</span>
                   </div>
                </div>
              </div>

              <div className="flex-1 relative w-full max-w-xl">
                 <div className="absolute -inset-4 bg-gradient-to-tr from-[#1D9E75]/20 to-transparent rounded-[3rem] blur-2xl"></div>
                 <div className="relative aspect-[4/3] rounded-[3rem] overflow-hidden shadow-2xl shadow-[#072E1F]/20 border-8 border-white">
                    <img 
                       src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=2069&auto=format&fit=crop" 
                       alt="Belorama Living" 
                       className="w-full h-full object-cover"
                    />
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* Habitaciones Disponibles */}
        <section className="bg-white py-24 rounded-t-[4rem] shadow-2xl shadow-[#072E1F]/5">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
              <div className="space-y-4">
                 <h2 className="text-4xl font-black text-[#072E1F] tracking-tighter">Habitaciones Disponibles</h2>
                 <p className="text-gray-400 font-medium">Encuentra el espacio que mejor se adapte a tu ritmo de vida.</p>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-[#1D9E75] uppercase tracking-widest bg-[#1D9E75]/5 px-4 py-2 rounded-xl">
                <Building2 size={14} />
                {habitacionesLibres.length} Espacios listos hoy
              </div>
            </div>

            {habitacionesLibres.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {habitacionesLibres.map((habitacion) => {
                  const mainImage =
                    (habitacion.publicacion?.fotos && habitacion.publicacion.fotos.length > 0) ? habitacion.publicacion.fotos[0] :
                      (habitacion.fotos && habitacion.fotos.length > 0) ? habitacion.fotos[0] :
                        (habitacion.residencia.fotos && habitacion.residencia.fotos.length > 0) ? habitacion.residencia.fotos[0] :
                          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

                  return (
                    <div key={habitacion.id} className="group bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden hover:scale-[1.02] transition-all duration-500 hover:shadow-2xl hover:shadow-[#1D9E75]/5">
                      <div className="relative aspect-[16/10]">
                        <img
                          src={mainImage}
                          alt={habitacion.numero}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md text-[#1D9E75] text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-xl">
                          S/ {habitacion.precioMantenimiento || '850'}
                        </div>
                      </div>
                      
                      <div className="p-8">
                        <div className="flex items-center gap-2 text-[9px] font-black text-[#1D9E75] uppercase tracking-[0.2em] mb-3">
                           <MapPin size={10} />
                           {habitacion.residencia.nombre}
                        </div>
                        
                        <h3 className="text-2xl font-black text-[#072E1F] mb-4 group-hover:text-[#1D9E75] transition-colors leading-none">
                           Habitación {habitacion.numero}
                        </h3>
                        
                        <div className="flex items-center gap-6 mb-8">
                           <div className="flex items-center gap-2 text-gray-400">
                              <Users size={16} />
                              <span className="text-xs font-bold">{habitacion.capacidad} Pers.</span>
                           </div>
                           <div className="flex items-center gap-2 text-gray-400">
                              <BedDouble size={16} />
                              <span className="text-xs font-bold">Nivel {habitacion.piso}</span>
                           </div>
                        </div>

                        <Link
                          href={`/auth/login`}
                          className="w-full bg-gray-50 group-hover:bg-[#072E1F] text-gray-400 group-hover:text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                        >
                          Ver Disponibilidad
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-20 bg-gray-50/50 rounded-[3rem] border border-gray-100 border-dashed">
                <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
                  <BedDouble className="w-10 h-10 text-gray-200" />
                </div>
                <h3 className="text-2xl font-black text-[#072E1F]">Todas las plazas están reservadas</h3>
                <p className="text-gray-400 max-w-sm mx-auto mt-2 font-medium">
                  Nuestro coliving está al máximo. ¡Déjanos tu contacto para avisarte en cuanto se libere una habitación!
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer Premium */}
      <footer className="bg-[#072E1F] text-white pt-24 pb-12 rounded-t-[4rem]">
        <div className="max-w-7xl mx-auto px-10">
          <div className="flex flex-col md:flex-row justify-between items-start gap-16 mb-20">
             <div className="max-w-xs space-y-6">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-[#1D9E75] rounded-xl flex items-center justify-center">
                      <span className="font-black">B</span>
                   </div>
                   <span className="text-2xl font-black tracking-tighter">Belorama</span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                   Redefiniendo la gestión residencial para la nueva generación de coliving.
                </p>
             </div>
             
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-20 gap-y-10">
                <div className="space-y-4">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-[#1D9E75]">Explorar</h4>
                   <ul className="text-sm text-gray-400 space-y-2">
                      <li><Link href="/" className="hover:text-white transition-colors">Habitaciones</Link></li>
                      <li><Link href="/" className="hover:text-white transition-colors">Residencias</Link></li>
                      <li><Link href="/" className="hover:text-white transition-colors">Beneficios</Link></li>
                   </ul>
                </div>
                <div className="space-y-4">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-[#1D9E75]">Soporte</h4>
                   <ul className="text-sm text-gray-400 space-y-2">
                      <li><Link href="/" className="hover:text-white transition-colors">Ayuda</Link></li>
                      <li><Link href="/" className="hover:text-white transition-colors">Contacto</Link></li>
                      <li><Link href="/" className="hover:text-white transition-colors">Privacidad</Link></li>
                   </ul>
                </div>
             </div>
          </div>
          
          <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">
              &copy; {new Date().getFullYear()} Belorama &middot; Crafted with Excellence
            </p>
            <div className="flex items-center gap-6">
                <ShieldCheck className="text-[#1D9E75]/50" size={18} />
                <span className="text-[10px] font-black text-white/30 uppercase">Secure Platform</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}