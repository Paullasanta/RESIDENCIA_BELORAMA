import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { MenuForm } from '@/components/forms/MenuForm'
import { getDailyPlanByDate } from '@/app/actions/comida'
import { redirect } from 'next/navigation'

export default async function EditarMenuPage(props: { searchParams: Promise<{ fecha?: string }> }) {
    const searchParams = await props.searchParams;
    const fecha = searchParams.fecha;
    if (!fecha) redirect('/modules/comida');

    const [residencias, planRes] = await Promise.all([
        prisma.residencia.findMany({ orderBy: { nombre: 'asc' } }),
        getDailyPlanByDate(fecha)
    ]);

    if (!planRes.success || !planRes.data || planRes.data.length === 0) {
        redirect('/modules/comida');
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <PageHeader
                title="Editar Menú"
                description={`Modificando la programación para el ${new Date(fecha + "T12:00:00Z").toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}`}
            />
            
            <MenuForm 
                residencias={residencias} 
                initialData={planRes.data} 
            />
        </div>
    )
}
