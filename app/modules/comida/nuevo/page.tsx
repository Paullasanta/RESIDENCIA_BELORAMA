import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { MenuForm } from '@/components/forms/MenuForm'

export default async function NuevoMenuPage() {
    const residencias = await prisma.residencia.findMany({
        orderBy: { nombre: 'asc' }
    })

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <PageHeader
                title="Publicar Menú"
                description="Define la programación de comidas para las residencias seleccionadas."
            />
            
            <MenuForm residencias={residencias} />
        </div>
    )
}
