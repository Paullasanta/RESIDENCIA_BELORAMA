import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { FinancialCharts } from '@/components/reportes/FinancialCharts'
import { DollarSign, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react'

export default async function ReportesPage() {
    const session = await auth()
    const { rol, residenciaId } = session!.user
    const isGlobalAdmin = rol === 'ADMIN' && !residenciaId

    // Aislamiento de datos
    const whereResidencia = isGlobalAdmin ? {} : { residenciaId: residenciaId || -1 }
    const wherePagos = isGlobalAdmin ? {} : { residente: { user: { residenciaId: residenciaId || -1 } } }

    // Obtener datos de los últimos 6 meses
    const seisMesesAtras = new Date()
    seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6)

    const [pagos, egresos] = await Promise.all([
        prisma.pago.findMany({
            where: {
                createdAt: { gte: seisMesesAtras },
                ...wherePagos
            },
            select: { montoPagado: true, createdAt: true }
        }),
        prisma.egreso.findMany({
            where: {
                fecha: { gte: seisMesesAtras },
                ...whereResidencia
            },
            select: { monto: true, fecha: true }
        })
    ])

    // Procesar datos para el gráfico
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    const dataMap: Record<string, { month: string, ingresos: number, egresos: number }> = {}

    // Inicializar últimos 6 meses
    for (let i = 5; i >= 0; i--) {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        const key = `${d.getFullYear()}-${d.getMonth()}`
        dataMap[key] = {
            month: meses[d.getMonth()],
            ingresos: 0,
            egresos: 0
        }
    }

    pagos.forEach(p => {
        const key = `${p.createdAt.getFullYear()}-${p.createdAt.getMonth()}`
        if (dataMap[key]) dataMap[key].ingresos += p.montoPagado
    })

    egresos.forEach(e => {
        const key = `${e.fecha.getFullYear()}-${e.fecha.getMonth()}`
        if (dataMap[key]) dataMap[key].egresos += e.monto
    })

    const chartData = Object.values(dataMap)

    const totalIngresos = chartData.reduce((acc, curr) => acc + curr.ingresos, 0)
    const totalEgresos = chartData.reduce((acc, curr) => acc + curr.egresos, 0)
    const balanceTotal = totalIngresos - totalEgresos

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <PageHeader 
                title="Reportes y Analítica" 
                description="Análisis profundo del flujo de caja de los últimos 6 meses." 
            />

            {/* Resumen Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col gap-4">
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                        <ArrowUpRight size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Ingresos (6m)</p>
                        <p className="text-3xl font-black text-[#072E1F] tracking-tight">${totalIngresos.toLocaleString()}</p>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col gap-4">
                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                        <ArrowDownRight size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Egresos (6m)</p>
                        <p className="text-3xl font-black text-[#072E1F] tracking-tight">${totalEgresos.toLocaleString()}</p>
                    </div>
                </div>

                <div className="bg-[#072E1F] p-8 rounded-[2.5rem] text-white shadow-2xl shadow-[#072E1F]/20 flex flex-col gap-4">
                    <div className="w-12 h-12 bg-white/10 text-[#1D9E75] rounded-2xl flex items-center justify-center">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Balance Neto</p>
                        <p className="text-3xl font-black tracking-tight">${balanceTotal.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-gray-100 shadow-xl overflow-hidden">
                <h3 className="text-lg font-black text-[#072E1F] mb-8 flex items-center gap-2">
                    <DollarSign size={20} className="text-[#1D9E75]" />
                    Flujo de Caja Mensual
                </h3>
                <div className="relative h-[400px] w-full min-h-[400px]">
                    <FinancialCharts data={chartData} />
                </div>
            </div>
        </div>
    )
}
