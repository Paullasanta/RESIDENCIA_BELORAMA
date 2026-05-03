import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, BedDouble, Users, ArrowLeft, Building2, Layers, Phone, MessageSquare } from 'lucide-react'

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="aspect-video rounded-2xl overflow-hidden shadow-lg bg-gray-200">
              <img src={photos[0]} alt={title} className="w-full h-full object-cover" />
            </div>

            <div>
              <h1 className="text-3xl font-black text-gray-900">{title}</h1>
              <div className="flex items-center gap-2 mt-2 text-gray-500">
                <MapPin className="w-4 h-4 text-[#1D9E75]" />
                <span className="text-sm font-bold">{habitacion.residencia.direccion}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-y border-gray-100">
              <div className="flex flex-col items-center gap-1 bg-white p-4 rounded-2xl border border-gray-50">
                <Users className="w-5 h-5 text-[#1D9E75]" />
                <span className="text-sm font-black">{habitacion.capacidad} Pers.</span>
              </div>
              <div className="flex flex-col items-center gap-1 bg-white p-4 rounded-2xl border border-gray-50">
                <Layers className="w-5 h-5 text-[#1D9E75]" />
                <span className="text-sm font-black">Nivel {habitacion.piso}</span>
              </div>
              <div className="flex flex-col items-center gap-1 bg-white p-4 rounded-2xl border border-gray-50">
                <Building2 className="w-5 h-5 text-[#1D9E75]" />
                <span className="text-xs font-black text-center">{habitacion.residencia.nombre}</span>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-black text-[#072E1F] mb-3">Descripción</h2>
              <p className="text-gray-600 leading-relaxed">{description}</p>
            </div>

            <div>
              <h2 className="text-lg font-black text-[#072E1F] mb-3">Ubicación</h2>
              <div className="rounded-2xl overflow-hidden border border-gray-100 h-64 sm:h-80 shadow-sm">
                <iframe src={mapSrc} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" />
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-[2rem] border border-gray-100 shadow-xl p-8 space-y-6">
              <h2 className="text-xl font-black text-[#072E1F]">¿Te interesa?</h2>
              <p className="text-sm text-gray-400 font-medium leading-relaxed">
                Ponte en contacto directamente con el administrador para solicitar esta habitación.
              </p>

              <a
                href={`tel:${CELULAR.replace(/\s/g, '')}`}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-[#072E1F] text-white font-black text-xs uppercase tracking-widest hover:bg-[#1D9E75] transition-all"
              >
                <Phone size={18} />
                Llamar Ahora
              </a>

              <a
                href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hola, me interesa la ${title} en ${habitacion.residencia.nombre}. ¿Está disponible?`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-green-600 text-white font-black text-xs uppercase tracking-widest hover:bg-green-700 transition-all"
              >
                <MessageSquare size={18} />
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
