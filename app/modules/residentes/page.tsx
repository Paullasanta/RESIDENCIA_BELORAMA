import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { UserPlus } from 'lucide-react'
import Link from 'next/link'
import { ResidentesTable } from '@/components/admin/ResidentesTable'

export default async function ResidentesPage() {
    const residentes = await prisma.residente.findMany({
        include: {
            user: true,
            habitacion: {
                include: { residencia: true },
            },
            pagos: {
                orderBy: { createdAt: 'desc' },
                take: 1,
            },
        },
        orderBy: { fechaIngreso: 'desc' },
    })

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <PageHeader
                    title="Residentes"
                    description="Administración de perfiles, accesos y asignación de habitaciones."
                />
                <Link
                    href="/modules/residentes/nuevo"
                    className="flex items-center justify-center gap-2 bg-[#1D9E75] hover:bg-[#167e5d] text-white px-6 py-3 rounded-[1.25rem] font-bold transition-all shadow-xl shadow-[#1D9E75]/20 text-sm whitespace-nowrap"
                >
                    <UserPlus size={18} />
                    Añadir Nuevo Residente
                </Link>
            </div>

            <ResidentesTable residentes={residentes} />
        </div>
    )
}
