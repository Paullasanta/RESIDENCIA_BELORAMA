import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { MapPin, BedDouble, Users, ArrowRight } from 'lucide-react'

export default async function Home() {
  const session = await auth()

  const habitacionesLibres = await prisma.habitacion.findMany({
    where: { estado: 'LIBRE' },
    include: {
      residencia: true,
      publicacion: true
    }
  })

  // Logica de redireccion si el usuario clickea "Ir a mi Panel"
  const getDashboardUrl = () => {
    if (!session) return '/auth/login'
    if (session.user.rol === 'ADMIN') return '/modules/dashboard'
    if (session.user.rol === 'RESIDENTE') return '/modules/marketplace'
    if (session.user.rol === 'COCINERO') return '/modules/comida'
    return '/modules/dashboard'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <BedDouble className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Belorama</span>
            </div>
            <div>
              {session ? (
                <Link
                  href={getDashboardUrl()}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Ir a mi Panel
                </Link>
              ) : (
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Iniciar Sesión
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Encuentra tu</span>
              <span className="block text-blue-600">próximo hogar</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Explora las habitaciones disponibles en nuestras residencias. Disfruta de un ambiente cómodo, seguro y diseñado para ti.
            </p>
          </div>

          {/* Grid de Habitaciones */}
          {habitacionesLibres.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {habitacionesLibres.map((habitacion) => {
                // Obtener imagen principal (prioridad: publicacion -> habitacion -> residencia)
                const mainImage =
                  (habitacion.publicacion?.fotos && habitacion.publicacion.fotos.length > 0) ? habitacion.publicacion.fotos[0] :
                    (habitacion.fotos && habitacion.fotos.length > 0) ? habitacion.fotos[0] :
                      (habitacion.residencia.fotos && habitacion.residencia.fotos.length > 0) ? habitacion.residencia.fotos[0] :
                        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

                const title = habitacion.publicacion?.titulo || `Habitación ${habitacion.numero}`;
                const description = habitacion.publicacion?.descripcion || habitacion.residencia.descripcion || 'Una habitación cómoda y equipada lista para ti.';

                return (
                  <div key={habitacion.id} className="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <div className="relative h-48 sm:h-56">
                      <img
                        src={mainImage}
                        alt={title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-sm">
                        Disponible
                      </div>
                    </div>
                    <div className="flex-1 p-6 flex flex-col">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 line-clamp-1" title={title}>{title}</h3>
                      </div>

                      <div className="flex items-center text-gray-500 text-sm mb-4">
                        <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span className="line-clamp-1" title={`${habitacion.residencia.nombre} - ${habitacion.residencia.direccion}`}>
                          {habitacion.residencia.nombre} - {habitacion.residencia.direccion}
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm mb-6 flex-1 line-clamp-3">
                        {description}
                      </p>

                      <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center" title="Capacidad">
                            <Users className="w-4 h-4 mr-1" />
                            <span>{habitacion.capacidad} {habitacion.capacidad === 1 ? 'persona' : 'personas'}</span>
                          </div>
                          <div className="flex items-center" title="Piso">
                            <BedDouble className="w-4 h-4 mr-1" />
                            <span>Piso {habitacion.piso}</span>
                          </div>
                        </div>
                        <Link
                          href={`/habitacion/${habitacion.id}`}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center group"
                        >
                          Más detalles
                          <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-20 px-4 sm:px-6 lg:px-8 bg-white rounded-2xl border border-gray-200 border-dashed">
              <div className="mx-auto w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <BedDouble className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay habitaciones disponibles</h3>
              <p className="text-gray-500 max-w-sm mx-auto mb-6">
                En este momento todas nuestras habitaciones están ocupadas. Vuelve a revisar más tarde.
              </p>
              {session ? (
                <Link
                  href={getDashboardUrl()}
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Ir a mi Panel
                </Link>
              ) : (
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Iniciar Sesión
                </Link>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Belorama. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}