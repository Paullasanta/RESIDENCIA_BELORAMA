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
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">{label}</h3>
        {icon && <span className="text-gray-300">{icon}</span>}
      </div>
      <p className={`text-4xl font-extrabold ${colorMap[color]}`}>
        {value}
        {sub && <span className="text-sm font-medium text-gray-400 ml-1">{sub}</span>}
      </p>
    </div>
  )
}
