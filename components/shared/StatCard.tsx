import { Users, TrendingUp, WashingMachine, Megaphone, UtensilsCrossed, ShoppingBag, Home } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  color?: 'green' | 'yellow' | 'dark' | 'teal'
  icon?: React.ReactNode
}

const colorMap = {
  green: 'text-[#1D9E75]',
  yellow: 'text-[#EF9F27]',
  dark: 'text-[#072E1F]',
  teal: 'text-[#085041]',
}

export function StatCard({ label, value, sub, color = 'green', icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-gray-100 flex flex-col gap-1 md:gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <h3 className="text-gray-400 text-[10px] md:text-xs font-black uppercase tracking-widest">{label}</h3>
        {icon && <span className="text-gray-200 hidden md:block">{icon}</span>}
      </div>
      <p className={`text-2xl md:text-4xl font-black tracking-tighter ${colorMap[color]}`}>
        {value}
        {sub && <span className="text-[10px] md:text-sm font-medium text-gray-400 ml-1">{sub}</span>}
      </p>
    </div>
  )
}
