import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, BedDouble, Users, ArrowLeft, Building2, Layers, Phone, MessageSquare } from 'lucide-react'
import { RoomGallery } from '@/components/shared/RoomGallery'

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

  // Obtener configuración de contactos
  const configs = await prisma.configuracion.findMany({
    where: { clave: { in: ['CELULAR_CONTACTO', 'WHATSAPP_CONTACTO'] } }
  })
  const configMap = configs.reduce((acc, curr) => ({ ...acc, [curr.clave]: curr.valor }), {} as Record<string, string>)

  const CELULAR = configMap.CELULAR_CONTACTO || '+51989766318'
  const WHATSAPP = configMap.WHATSAPP_CONTACTO || '51989766318'

  // Construir lista de todas las fotos disponibles
  const allPhotos: string[] = [
    ...(habitacion.publicacion?.fotos ?? []),
    ...(habitacion.fotos ?? []),
    ...(habitacion.residencia.fotos ?? []),
  ]
  const photos = allPhotos.length > 0 ? allPhotos : DEFAULT_IMGS

  const title = habitacion.publicacion?.titulo || `Habitación ${habitacion.numero}`
  const description = habitacion.publicacion?.descripcion || habitacion.residencia.descripcion || 'Una habitación cómoda y equipada lista para ti.'

  const lat = habitacion.publicacion?.coordLat
  const lng = habitacion.publicacion?.coordLng
  const mapSrc = lat && lng
    ? `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`
    : `https://maps.google.com/maps?q=${encodeURIComponent(habitacion.residencia.direccion)}&z=15&output=embed`

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a la búsqueda</span>
            </Link>
            <Link href="/auth/login" className="px-6 py-2 bg-[#1D9E75] text-white rounded-xl text-xs font-black uppercase tracking-widest">
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Galería de Fotos - Ancho Completo */}
        <div className="mb-10">
          <RoomGallery photos={photos} title={title} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Contenido Principal (Izquierda) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-black text-[#072E1F] tracking-tight">{title}</h1>
              <div className="flex items-center gap-2 text-gray-400">
                <MapPin className="w-5 h-5 text-[#1D9E75]" />
                <span className="text-base font-bold">{habitacion.residencia.direccion}</span>
              </div>
            </div>

            {/* Mapa Destacado (Subido de posición) */}
            <div className="rounded-[2.5rem] overflow-hidden border border-gray-100 h-[350px] sm:h-[450px] shadow-xl">
              <iframe src={mapSrc} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" />
            </div>

            {/* Características */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-8 border-y border-gray-100">
              <div className="flex flex-col items-center gap-2 bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm">
                <Users className="w-6 h-6 text-[#1D9E75]" />
                <span className="text-sm font-black">{habitacion.capacidad} Pers.</span>
              </div>
              <div className="flex flex-col items-center gap-2 bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm">
                <Layers className="w-6 h-6 text-[#1D9E75]" />
                <span className="text-sm font-black">Nivel {habitacion.piso}</span>
              </div>
              <div className="flex flex-col items-center gap-2 bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm col-span-2">
                <Building2 className="w-6 h-6 text-[#1D9E75]" />
                <span className="text-sm font-black text-center">{habitacion.residencia.nombre}</span>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-black text-[#072E1F]">Descripción</h2>
              <p className="text-gray-600 leading-relaxed text-lg">{description}</p>
            </div>
          </div>

          {/* Tarjeta de Contacto (Derecha - Sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/50 p-10 space-y-8">
              <div className="space-y-4">
                <h2 className="text-2xl font-black text-[#072E1F]">¿Te interesa?</h2>
                <p className="text-sm text-gray-400 font-bold leading-relaxed uppercase tracking-widest">
                  Contacta al administrador para reservar.
                </p>
              </div>

              <div className="space-y-4">
                <a
                  href={`tel:${CELULAR.replace(/\s/g, '')}`}
                  className="w-full flex items-center justify-center gap-4 py-5 rounded-2xl bg-[#072E1F] text-white font-black text-[11px] uppercase tracking-[0.2em] hover:bg-[#1D9E75] transition-all shadow-xl shadow-[#072E1F]/10"
                >
                  <Phone size={20} />
                  Llamar Ahora
                </a>

                <a
                  href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hola, me interesa la ${title} en ${habitacion.residencia.nombre}. ¿Está disponible?`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-4 py-5 rounded-2xl bg-[#25D366] text-white font-black text-[11px] uppercase tracking-[0.2em] hover:bg-[#128C7E] transition-all shadow-xl shadow-green-200"
                >
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.411 0 .01 5.403.007 12.04a11.722 11.722 0 001.568 5.83L0 24l6.305-1.654a11.752 11.752 0 005.741 1.498h.005c6.637 0 12.038-5.403 12.041-12.04a11.75 11.75 0 00-3.417-8.467z" />
                  </svg>
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
