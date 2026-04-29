import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { notFound } from 'next/navigation'
import { Calendar, User, ArrowLeft, CheckCircle, Clock } from 'lucide-react'
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
  const totalPagado = pagos.filter(p => p.estado === 'PAGADO').reduce((acc, p) => acc + p.monto, 0)
  const totalDeuda = pagos.filter(p => ['PENDIENTE', 'VENCIDO', 'CRITICO'].includes(p.estado)).reduce((acc, p) => acc + p.monto, 0)

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 max-w-5xl mx-auto">
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
              <h2 className="text-xl font-black text-[#072E1F]">Detalle de Pagos</h2>
              <span className="text-[10px] font-black text-gray-400 uppercase bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
                  {pagos.length} {pagos.length === 1 ? 'PAGO' : 'PAGOS'} REGISTRADOS
              </span>
          </div>

          <div className="divide-y divide-gray-50">
              {pagos.map((pago, index) => (
                  <div key={pago.id} className="p-8 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center gap-6">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${pago.estado === 'PAGADO' ? 'bg-green-100 text-green-600' : pago.estado === 'EN_REVISION' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                              {pagos.length - index}
                          </div>
                          <div>
                              <p className="text-lg font-black text-gray-900 leading-none mb-1">{pago.concepto}</p>
                              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-tighter">
                                  <span>S/ {pago.monto.toLocaleString('es-MX')}</span>
                                  <span>•</span>
                                  <span>Vencimiento: {pago.fechaVencimiento ? new Date(pago.fechaVencimiento).toLocaleDateString() : 'N/A'}</span>
                              </div>
                          </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <StatusBadge status={pago.estado as any} />
                      </div>
                  </div>
              ))}
          </div>
      </div>
    </div>
  )
}
