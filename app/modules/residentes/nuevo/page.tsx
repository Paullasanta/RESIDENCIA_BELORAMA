import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ResidenteForm } from '@/components/forms/ResidenteForm'
import { PageHeader } from '@/components/shared/PageHeader'
import { redirect } from 'next/navigation'

export default async function NuevoResidentePage({ searchParams }: { searchParams: Promise<{ reintegroId?: string }> }) {
    const session = await auth()
    if (!session) redirect('/auth/login')
    
    const { residenciaId, rol } = session.user
    const { reintegroId } = await searchParams

    // Obtener residencias para el selector (respetando aislamiento)
    const residencias = await prisma.residencia.findMany({
        where: (['ADMIN', 'SUPER_ADMIN'].includes(rol) && !residenciaId) ? {} : { id: residenciaId || -1 },
        include: {
            habitaciones: {
                where: { estado: 'LIBRE' }
            }
        }
    })

    let initialData = null

    // Si es un reingreso, cargar datos del residente antiguo
    if (reintegroId) {
        const oldResidente = await prisma.residente.findUnique({
            where: { id: parseInt(reintegroId) },
            include: { user: true }
        })

        if (oldResidente) {
            initialData = {
                user: {
                    dni: oldResidente.user.dni,
                    nombre: oldResidente.user.nombre,
                    apellidoPaterno: oldResidente.user.apellidoPaterno,
                    apellidoMaterno: oldResidente.user.apellidoMaterno,
                    email: oldResidente.user.email,
                    telefono: oldResidente.user.telefono,
                    emergenciaNombre: oldResidente.user.emergenciaNombre,
                    emergenciaTelefono: oldResidente.user.emergenciaTelefono,
                    emergenciaParentesco: oldResidente.user.emergenciaParentesco,
                    fechaNacimiento: oldResidente.user.fechaNacimiento
                },
                alergias: oldResidente.alergias,
                restriccionesAlimentarias: oldResidente.restriccionesAlimentarias,
                montoMensual: oldResidente.montoMensual,
                montoGarantia: oldResidente.montoGarantia,
                isReintegro: true,
                oldResidenteId: oldResidente.id
            }
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <PageHeader
                title={reintegroId ? "Reintegrar Residente" : "Nuevo Residente"}
                description={reintegroId ? "Configura la nueva estancia para este residente que regresa." : "Registra un nuevo residente y genera su contrato y cobros iniciales."}
            />
            
            <ResidenteForm 
                residencias={residencias} 
                initialData={initialData} 
            />
        </div>
    )
}
