import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { AvisoForm } from '@/components/forms/AvisoForm'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function NuevoAvisoPage() {
    const session = await auth()
    if (session?.user.rol !== 'ADMIN') {
        redirect('/modules/avisos')
    }

    const residencias = await prisma.residencia.findMany({
        orderBy: { nombre: 'asc' }
    })

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <PageHeader
                title="Publicar Aviso"
                description="Envía un comunicado importante a todos o a una residencia específica."
            />
            
            <AvisoForm residencias={residencias} />
        </div>
    )
}
