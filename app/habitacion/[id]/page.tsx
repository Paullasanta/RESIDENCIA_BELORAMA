import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, BedDouble, Users, ArrowLeft, Building2, Layers, Phone, Mail, MessageSquare } from 'lucide-react'

const DEFAULT_IMGS = [
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80',
]

export default async function HabitacionDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const habitacion = await prisma.habitacion.findUnique({
    where: { id: Number(id) },
    include: {
      residencia: true,
      publicacion: true,
    }
  })

  if (!habitacion || habitacion.estado !== 'LIBRE') {
    notFound()
  }

  // Construir lista de todas las fotos disponibles
  const allPhotos: string[] = [
    ...(habitacion.publicacion?.fotos ?? []),
    ...(habitacion.fotos ?? []),
    ...(habitacion.residencia.fotos ?? []),
  ]
  // Si no hay fotos reales, usar las de stock
  const photos = allPhotos.length > 0 ? allPhotos : DEFAULT_IMGS

  const title = habitacion.publicacion?.titulo || `Habitación ${habitacion.numero}`
  const description = habitacion.publicacion?.descripcion || habitacion.residencia.descripcion || 'Una habitación cómoda y equipada lista para ti. Ideal para estudiantes y profesionales.'

  const mainPhoto = photos[0]
  const thumbPhotos = photos.slice(1, 5)

  const lat = habitacion.publicacion?.coordLat
  const lng = habitacion.publicacion?.coordLng

  const mapSrc = lat && lng
    ? `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`
    : `https://maps.google.com/maps?q=${encodeURIComponent(habitacion.residencia.direccion)}&z=15&output=embed`

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span>Volver a la búsqueda</span>
              </Link>
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-8 h-8 bg-[#1D9E75] rounded-xl flex items-center justify-center shadow-lg shadow-[#1D9E75]/20">
                  <BedDouble className="w-4 h-4 text-white" />
                </div>
                <span className="text-base font-bold text-gray-900">Belorama</span>
              </div>
            </div>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-[#1D9E75] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#072E1F] transition-all shadow-xl shadow-[#1D9E75]/20"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Galería de fotos - Adaptativa según cantidad de imágenes */}
        {photos.length === 1 && (
          <div className="h-[320px] sm:h-[420px] rounded-2xl overflow-hidden mb-8">
            <img src={photos[0]} alt={title} className="w-full h-full object-cover" />
          </div>
        )}

        {photos.length === 2 && (
          <div className="grid grid-cols-2 gap-2 h-[320px] sm:h-[420px] rounded-2xl overflow-hidden mb-8">
            {photos.map((photo, i) => (
              <div key={i} className="relative group cursor-pointer">
                <img src={photo} alt={`${title} - foto ${i + 1}`} className="w-full h-full object-cover group-hover:brightness-90 transition-all" />
              </div>
            ))}
          </div>
        )}

        {photos.length === 3 && (
          <div className="grid grid-cols-2 gap-2 h-[320px] sm:h-[420px] rounded-2xl overflow-hidden mb-8">
            <div className="relative group cursor-pointer row-span-2">
              <img src={photos[0]} alt={title} className="w-full h-full object-cover group-hover:brightness-90 transition-all" />
            </div>
            <div className="relative group cursor-pointer">
              <img src={photos[1]} alt={`${title} - foto 2`} className="w-full h-full object-cover group-hover:brightness-90 transition-all" />
            </div>
            <div className="relative group cursor-pointer">
              <img src={photos[2]} alt={`${title} - foto 3`} className="w-full h-full object-cover group-hover:brightness-90 transition-all" />
            </div>
          </div>
        )}

        {photos.length >= 4 && (
          <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[320px] sm:h-[420px] rounded-2xl overflow-hidden mb-8">
            {/* Foto principal */}
            <div className="col-span-4 sm:col-span-2 row-span-2 relative group cursor-pointer">
              <img src={photos[0]} alt={title} className="w-full h-full object-cover group-hover:brightness-90 transition-all" />
            </div>
            {/* Miniaturas */}
            {photos.slice(1, 5).map((photo, i) => (
              <div key={i} className="relative group cursor-pointer hidden sm:block">
                <img src={photo} alt={`${title} - foto ${i + 2}`} className="w-full h-full object-cover group-hover:brightness-90 transition-all" />
                {i === 3 && photos.length > 5 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">+{photos.length - 5} fotos</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Contenido principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna izquierda - Detalles */}
          <div className="lg:col-span-2 space-y-6">
            {/* Título e Info básica */}
            <div>
              <p className="text-sm text-gray-500 mb-1">
                {habitacion.residencia.nombre} · Habitación {habitacion.numero}
              </p>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h1>
                <span className="flex-shrink-0 bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide border border-green-200">
                  Disponible
                </span>
              </div>

              <div className="flex items-center gap-1.5 mt-3 text-gray-500">
                <MapPin className="w-4 h-4 flex-shrink-0 text-[#1D9E75]" />
                <span className="text-sm">{habitacion.residencia.direccion}</span>
              </div>
            </div>

            {/* Características */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5 border-y border-gray-100">
              <div className="flex flex-col items-center gap-1.5 text-center">
                <div className="w-10 h-10 bg-[#1D9E75]/10 rounded-xl flex items-center justify-center">
                  <BedDouble className="w-5 h-5 text-[#1D9E75]" />
                </div>
                <span className="text-lg font-bold text-gray-900">{habitacion.capacidad}</span>
                <span className="text-xs text-gray-500">{habitacion.capacidad === 1 ? 'Persona' : 'Personas'}</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-center">
                <div className="w-10 h-10 bg-[#1D9E75]/10 rounded-xl flex items-center justify-center">
                  <Layers className="w-5 h-5 text-[#1D9E75]" />
                </div>
                <span className="text-lg font-bold text-gray-900">Piso {habitacion.piso}</span>
                <span className="text-xs text-gray-500">Nivel</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-center">
                <div className="w-10 h-10 bg-[#1D9E75]/10 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[#1D9E75]" />
                </div>
                <span className="text-lg font-bold text-gray-900 line-clamp-1 text-sm">{habitacion.residencia.nombre}</span>
                <span className="text-xs text-gray-500">Residencia</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-center">
                <div className="w-10 h-10 bg-[#1D9E75]/10 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#1D9E75]" />
                </div>
                <span className="text-lg font-bold text-gray-900">{habitacion.residencia.capacidad}</span>
                <span className="text-xs text-gray-500">Cap. residencia</span>
              </div>
            </div>

            {/* Descripción */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Descripción</h2>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base whitespace-pre-line">{description}</p>
            </div>

            {/* Mapa */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Ubicación</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                <MapPin className="w-4 h-4 text-[#1D9E75]" />
                <span>{habitacion.residencia.direccion}</span>
              </div>
              <div className="rounded-xl overflow-hidden border border-gray-200 h-64 sm:h-80">
                <iframe
                  src={mapSrc}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Ubicación de la habitación"
                />
              </div>
            </div>
          </div>

          {/* Columna derecha - Panel de contacto */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-bold text-gray-900">¿Te interesa esta habitación?</h2>
              <p className="text-sm text-gray-500">
                Ponte en contacto directamente con el administrador para solicitar esta habitación o resolver tus dudas.
              </p>

              <a
                href="tel:+51989766318"
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-[#072E1F] text-white font-black text-xs uppercase tracking-widest hover:bg-[#1D9E75] transition-all shadow-xl shadow-[#072E1F]/20"
              >
                <Phone size={16} />
                Llamar al Administrador
              </a>

              <a
                href={`https://wa.me/51989766318?text=${encodeURIComponent(`Hola, me interesa la ${title} en ${habitacion.residencia.nombre} (${habitacion.residencia.direccion}). ¿Está disponible?`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-green-600 text-white font-semibold text-sm hover:bg-green-700 transition-colors shadow-sm"
              >
                <MessageSquare className="w-4 h-4" />
                Contactar por WhatsApp
              </a>

              {/* Datos del inmueble resumen */}
              <div className="pt-4 border-t border-gray-100 space-y-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Resumen</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Habitación</span>
                  <span className="font-medium text-gray-900">N° {habitacion.numero}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Capacidad</span>
                  <span className="font-medium text-gray-900">{habitacion.capacidad} {habitacion.capacidad === 1 ? 'persona' : 'personas'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Piso</span>
                  <span className="font-medium text-gray-900">{habitacion.piso}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Estado</span>
                  <span className="font-medium text-green-600">Disponible</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Residencia</span>
                  <span className="font-medium text-gray-900 text-right max-w-[140px] line-clamp-1">{habitacion.residencia.nombre}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Belorama. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
