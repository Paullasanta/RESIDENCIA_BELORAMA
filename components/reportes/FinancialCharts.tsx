'use client'

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from 'recharts'

interface FinancialChartsProps {
    data: {
        month: string
        ingresos: number
        egresos: number
    }[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#072E1F] p-4 rounded-2xl shadow-2xl border border-white/10 text-white animate-in zoom-in-95 duration-200">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#1D9E75] mb-2">{label}</p>
                <div className="space-y-1">
                    <div className="flex items-center justify-between gap-8">
                        <span className="text-xs font-bold text-white/60">Ingresos:</span>
                        <span className="text-xs font-black text-[#1D9E75]">${payload[0].value.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between gap-8">
                        <span className="text-xs font-bold text-white/60">Egresos:</span>
                        <span className="text-xs font-black text-red-400">${payload[1].value.toLocaleString()}</span>
                    </div>
                    <div className="pt-2 border-t border-white/5 mt-2 flex items-center justify-between gap-8">
                        <span className="text-xs font-black uppercase">Balance:</span>
                        <span className={`text-sm font-black ${payload[0].value - payload[1].value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ${(payload[0].value - payload[1].value).toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
        )
    }
    return null
}

export function FinancialCharts({ data }: FinancialChartsProps) {
    return (
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                barGap={8}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 800 }}
                    dy={10}
                />
                <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 800 }}
                    tickFormatter={(value) => `$${value}`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F9FAFB' }} />
                <Legend 
                    verticalAlign="top" 
                    align="right" 
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ paddingTop: '0px', paddingBottom: '30px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}
                />
                <Bar 
                    dataKey="ingresos" 
                    name="Ingresos" 
                    fill="#1D9E75" 
                    radius={[6, 6, 0, 0]} 
                    barSize={24}
                />
                <Bar 
                    dataKey="egresos" 
                    name="Egresos" 
                    fill="#EF4444" 
                    radius={[6, 6, 0, 0]} 
                    barSize={24}
                    fillOpacity={0.8}
                />
            </BarChart>
        </ResponsiveContainer>
    )
}
