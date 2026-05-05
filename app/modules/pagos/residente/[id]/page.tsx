import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { notFound } from 'next/navigation'
import { ArrowLeft, CheckCircle, Clock, History } from 'lucide-react'
import Link from 'next/link'
import { PagoItemAdmin } from '@/components/admin/PagoItemAdmin'

export default async function DetallePagosResidentePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params
  const residenteId = parseInt(idStr)

  if (isNaN(residenteId)) notFound()

  const residente = await prisma.residente.findUnique({
    where: { id: residenteId },
    include: {
      user: true,
      habitacion: { include: { residencia: true } },
      pagos: {
        orderBy: { fechaVencimiento: 'desc' }
      }
    }
  })

  if (!residente) notFound()

  const pagos = residente.pagos
  
  // Separar pagos: Vigentes (Estancia actual) vs Históricos (Estancias pasadas)
  const fI = new Date(residente.fechaIngreso)
  fI.setUTCDate(1); fI.setUTCHours(0,0,0,0)

  const pagosVigentes = pagos.filter(p => {
    const fV = new Date(p.fechaVencimiento || p.createdAt); fV.setUTCHours(12, 0, 0, 0)
    return fV >= fI && p.estado !== 'RECHAZADO'
  })

  const pagosHistoricos = pagos.filter(p => {
    const fV = new Date(p.fechaVencimiento || p.createdAt); fV.setUTCHours(12, 0, 0, 0)
    return fV < fI || p.estado === 'RECHAZADO'
  })

  const totalPagado = pagosVigentes.filter(p => p.estado === 'PAGADO').reduce((acc, p) => acc + p.monto, 0)
  const totalDeuda = pagosVigentes.filter(p => ['PENDIENTE', 'VENCIDO', 'CRITICO'].includes(p.estado)).reduce((acc, p) => acc + p.monto, 0)

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 max-w-5xl mx-auto pb-20">
      <div className="flex items-center">
          <Link 
            href="/modules/pagos" 
            className="inline-flex items-center justify-center w-10 h-10 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-[#1D9E75] hover:shadow-lg transition-all active:scale-90"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="ml-4">
              <h1 className="text-2xl font-black text-[#072E1F] tracking-tighter">Estado de Cuenta</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{residente.user.nombre}</p>
          </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-6">
          <div className="bg-white rounded-[2rem] p-4 sm:p-8 border border-gray-50 shadow-xl shadow-gray-200/20 flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-6 group transition-all">
              <div className="w-10 h-10 sm:w-16 sm:h-16 bg-green-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-green-600 border border-green-100 shrink-0">
                  <CheckCircle size={24} className="sm:hidden" />
                  <CheckCircle size={32} className="hidden sm:block" />
              </div>
              <div className="text-center sm:text-left">
                  <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Pagado</p>
                  <p className="text-sm sm:text-3xl font-black text-[#072E1F] tracking-tighter">S/ {totalPagado.toLocaleString('es-MX')}</p>
              </div>
          </div>

          <div className="bg-white rounded-[2rem] p-4 sm:p-8 border border-red-50 shadow-xl shadow-gray-200/20 flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-6 group transition-all">
              <div className="w-10 h-10 sm:w-16 sm:h-16 bg-red-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-red-500 border border-red-100 shrink-0">
                  <Clock size={24} className="sm:hidden" />
                  <Clock size={32} className="hidden sm:block" />
              </div>
              <div className="text-center sm:text-left">
                  <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Pendiente</p>
                  <p className="text-sm sm:text-3xl font-black text-red-600 tracking-tighter">S/ {totalDeuda.toLocaleString('es-MX')}</p>
              </div>
          </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
              <h2 className="text-xl font-black text-[#072E1F]">Detalle de Pagos Actuales</h2>
              <span className="text-[10px] font-black text-gray-400 uppercase bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
                  {pagosVigentes.length} {pagosVigentes.length === 1 ? 'PAGO' : 'PAGOS'} VIGENTES
              </span>
          </div>

          <div className="divide-y divide-gray-50">
               {(() => {
                  if (pagosVigentes.length === 0) return <div className="p-20 text-center text-gray-400 font-bold italic">No hay pagos registrados para la estancia actual.</div>
                  
                  const grouped: Record<string, any[]> = {}
                  pagosVigentes.forEach(pago => {
                      const date = pago.fechaVencimiento ? new Date(pago.fechaVencimiento) : new Date(pago.createdAt)
                      const key = `${date.getUTCFullYear()}-${date.getUTCMonth()}`
                      if (!grouped[key]) grouped[key] = []
                      grouped[key].push(pago)
                  })
                  const sortedKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

                  return sortedKeys.map(key => {
                      const [year, month] = key.split('-')
                      const dateObj = new Date(parseInt(year), parseInt(month), 1)
                      const monthLabel = dateObj.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
                      return (
                          <div key={key} className="relative">
                              <div className="sticky top-0 bg-gray-50/80 backdrop-blur-md px-8 py-3 z-10 border-y border-gray-100/50">
                                  <h3 className="text-[10px] font-black text-[#1D9E75] uppercase tracking-[0.3em]">{monthLabel}</h3>
                              </div>
                              <div className="divide-y divide-gray-50">
                                  {grouped[key].map((pago) => (
                                      <PagoItemAdmin key={pago.id} pago={pago} />
                                  ))}
                              </div>
                          </div>
                      )
                  })
               })()}
          </div>
      </div>

      {/* Sección de Historial */}
      {pagosHistoricos.length > 0 && (
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
              <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/10 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-gray-400">Historial de Estancias Anteriores</h2>
                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-1">Registros archivados y pagos rechazados</p>
                  </div>
                  <History className="text-gray-200" size={24} />
              </div>
              <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                  {pagosHistoricos.map(pago => (
                      <PagoItemAdmin key={pago.id} pago={pago} isHistorical />
                  ))}
              </div>
          </div>
      )}
    </div>
  )
}


