'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavLinkProps {
  href: string
  children: React.ReactNode
  activeColor?: string
}

export function NavLink({ href, children, activeColor = 'bg-[#1D9E75]/20 text-[#1D9E75]' }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-colors text-sm ${
        isActive
          ? activeColor
          : 'text-gray-300 hover:bg-white/5 hover:text-white'
      }`}
    >
      {children}
    </Link>
  )
}
