import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { AvisoForm } from '@/components/forms/AvisoForm'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function EditarAvisoPage({ params }: { params: { id: string } }) {
    const session = await auth()
    if (session?.user.rol !== 'ADMIN') {
        redirect('/modules/avisos')
    }

    const avisoId = Number(params.id)
    if (isNaN(avisoId)) {
        redirect('/modules/avisos')
    }

    const aviso = await prisma.aviso.findUnique({
        where: { id: avisoId }
    })

    if (!aviso) {
        redirect('/modules/avisos')
    }

    const residencias = await prisma.residencia.findMany({
        orderBy: { nombre: 'asc' }
    })

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <PageHeader
                title="Editar Aviso"
                description="Modifica los detalles del comunicado."
            />
            
            <AvisoForm residencias={residencias} initialData={aviso} />
        </div>
    )
}
