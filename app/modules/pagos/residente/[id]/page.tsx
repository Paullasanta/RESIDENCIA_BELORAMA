import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { notFound } from 'next/navigation'
import { Calendar, User, ArrowLeft, CheckCircle, Clock, History } from 'lucide-react'
import Link from 'next/link'

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
      <div className="flex items-center justify-between">
          <Link 
            href="/modules/pagos" 
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-100 rounded-2xl text-xs font-black text-gray-400 hover:text-[#072E1F] hover:shadow-lg transition-all"
          >
            <ArrowLeft size={16} />
            VOLVER A PAGOS
          </Link>
      </div>

      <PageHeader
        title={`Historial de Pagos`}
        description={`Gestión de estado de cuenta para ${residente.user.nombre}.`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-[2.5rem] p-8 border shadow-xl shadow-gray-200/20 flex items-center gap-6 group hover:-translate-y-1 transition-all duration-300">
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 border border-green-100">
                  <CheckCircle size={32} />
              </div>
              <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Total Pagado</p>
                  <p className="text-3xl font-black text-[#072E1F] tracking-tighter">S/ {totalPagado.toLocaleString('es-MX')}</p>
              </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border shadow-xl shadow-gray-200/20 flex items-center gap-6 group hover:-translate-y-1 transition-all duration-300 border-red-100">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 border border-red-100">
                  <Clock size={32} />
              </div>
              <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Deuda Pendiente</p>
                  <p className="text-3xl font-black text-red-600 tracking-tighter">S/ {totalDeuda.toLocaleString('es-MX')}</p>
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
                                      <PagoItem key={pago.id} pago={pago} />
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
                      <PagoItem key={pago.id} pago={pago} isHistorical />
                  ))}
              </div>
          </div>
      )}
    </div>
  )
}

function PagoItem({ pago, isHistorical = false }: { pago: any, isHistorical?: boolean }) {
    const dObj = pago.fechaVencimiento ? new Date(pago.fechaVencimiento) : null
    const day = dObj ? dObj.getUTCDate() : '—'
    const monthShort = dObj ? dObj.toLocaleDateString('es-MX', { month: 'short', timeZone: 'UTC' }).replace('.', '') : '—'

    return (
        <div className={`p-8 flex items-center justify-between hover:bg-gray-50/30 transition-colors ${isHistorical ? 'py-4' : ''}`}>
            <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black border ${
                pago.estado === 'PAGADO' ? 'bg-green-50 text-green-600 border-green-100' : 
                pago.estado === 'EN_REVISION' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                pago.estado === 'RECHAZADO' ? 'bg-red-50 text-red-300 border-red-100' :
                'bg-gray-50 text-gray-400 border-gray-100'
                }`}>
                    <span className="text-[10px] uppercase leading-none mb-1 opacity-60">{monthShort}</span>
                    <span className="text-lg leading-none">{day}</span>
                </div>
                <div>
                    <p className={`text-lg font-black text-[#072E1F] leading-none mb-2 ${isHistorical ? 'text-sm text-gray-400' : ''}`}>{pago.concepto}</p>
                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <span className={isHistorical ? 'text-gray-300' : 'text-[#1D9E75]'}>S/ {pago.monto.toLocaleString('es-MX')}</span>
                        <span>•</span>
                        <span>Vence: {dObj ? dObj.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', timeZone: 'UTC' }) : 'N/A'}</span>
                        {pago.fechaPago && (
                            <>
                            <span>•</span>
                            <span className="text-green-600">Pagado: {new Date(pago.fechaPago).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-4">
            <StatusBadge status={pago.estado as any} />
            </div>
        </div>
    )
}
