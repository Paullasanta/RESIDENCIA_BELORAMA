import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PayCuotaButton } from '@/components/shared/PayCuotaButton'
import { PayAllButton } from '@/components/shared/PayAllButton'
import { notFound } from 'next/navigation'
import { Calendar, User, CreditCard, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function DetallePagoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params
  const id = parseInt(idStr)

  if (isNaN(id)) notFound()

  const pago = await prisma.pago.findUnique({
    where: { id },
    include: {
      residente: { include: { user: true } },
      cuotas: { orderBy: { fechaVencimiento: 'asc' } }
    }
  })

  if (!pago) notFound()

  const saldoPendiente = pago.monto - pago.montoPagado
  const allPaid = saldoPendiente <= 0

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
          {saldoPendiente > 0 && <PayAllButton pagoId={pago.id} isDisabled={allPaid} />}
      </div>

      <PageHeader
        title={`Detalle de Cobro: ${pago.concepto}`}
        description={`Gestión de cuotas y estado de cuenta para ${pago.residente.user.nombre}.`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Resumen del Pago */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-100 border border-gray-100">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <CreditCard size={16} /> RESUMEN
                </h3>
                
                <div className="space-y-6">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Total del Contrato</p>
                        <p className="text-3xl font-black text-gray-900">${pago.monto.toLocaleString('es-MX')}</p>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl border border-green-100">
                        <div>
                            <p className="text-[10px] font-bold text-green-600 uppercase">Pagado</p>
                            <p className="text-xl font-black text-green-700">${pago.montoPagado.toLocaleString('es-MX')}</p>
                        </div>
                        <StatusBadge status={pago.estado as any} />
                    </div>

                    {saldoPendiente > 0 && (
                        <div className="flex items-center justify-between p-4 bg-red-50 rounded-2xl border border-red-100 text-red-600">
                            <div>
                                <p className="text-[10px] font-bold uppercase">Pendiente</p>
                                <p className="text-xl font-black">${saldoPendiente.toLocaleString('es-MX')}</p>
                            </div>
                        </div>
                    )}

                    <div className="pt-6 border-t border-gray-100">
                        <div className="flex items-center gap-3 text-sm text-gray-600 font-bold mb-2">
                            <User size={16} className="text-[#1D9E75]" />
                            {pago.residente.user.nombre}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                            <Calendar size={16} />
                            Registrado el {new Date(pago.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Listado de Cuotas */}
        <div className="lg:col-span-2">
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                    <h2 className="text-xl font-black text-[#072E1F]">Cronograma de Cuotas</h2>
                    <span className="text-[10px] font-black text-gray-400 uppercase bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
                        {pago.cuotas.length} {pago.cuotas.length === 1 ? 'PAGO' : 'CUOTAS'}
                    </span>
                </div>

                <div className="divide-y divide-gray-50">
                    {pago.cuotas.map((cuota, index) => (
                        <div key={cuota.id} className="p-8 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                            <div className="flex items-center gap-6">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${cuota.pagado ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                    {index + 1}
                                </div>
                                <div>
                                    <p className="text-lg font-black text-gray-900">${cuota.monto.toLocaleString('es-MX')}</p>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">
                                        Vence el {new Date(cuota.fechaVencimiento).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <PayCuotaButton id={cuota.id} pagado={cuota.pagado} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
