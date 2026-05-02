import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { WashingMachine, Clock } from 'lucide-react'
import { AddLavadoraButton } from '@/components/admin/AddLavadoraButton'
import { ResidenciaSelector } from '@/components/admin/ResidenciaSelector'
import { LavadoraSection } from '@/components/admin/LavadoraSection'

const DIAS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'] as const
const DIA_LABEL: Record<string, string> = {
    LUNES: 'Lunes', MARTES: 'Martes', MIERCOLES: 'Miércoles', 
    JUEVES: 'Jueves', VIERNES: 'Viernes', SABADO: 'Sábado', DOMINGO: 'Domingo',
}

export default async function LavanderiaPage({ searchParams }: { searchParams: Promise<any> }) {
    const session = await auth()
    const { rol, permisos, residenciaId: sessionResId } = session!.user
    const canManage = rol === 'ADMIN' || permisos?.includes('MANAGE_LAVANDERIA')
    
    // Obtener parámetro de búsqueda para filtro de admin
    const searchParamsObj = await (searchParams as any)
    const filterResidenciaId = searchParamsObj?.residenciaId ? parseInt(searchParamsObj.residenciaId) : null

    const isGlobal = rol === 'ADMIN' && !sessionResId

    // Aislamiento: Prioridad de residencia
    let residenciaId: number | null = filterResidenciaId || sessionResId || null
    
    if (rol === 'RESIDENTE') {
        const profile = await prisma.residente.findFirst({
            where: { userId: session!.user.id },
            select: { habitacion: { select: { residenciaId: true } } }
        })
        residenciaId = profile?.habitacion?.residenciaId ?? sessionResId ?? null
    } else if (rol === 'COCINERO') {
        // Asegurar que el cocinero tenga su residenciaId
        if (!residenciaId) {
            const userDb = await prisma.user.findUnique({
                where: { id: session!.user.id },
                select: { residenciaId: true }
            })
            residenciaId = userDb?.residenciaId ?? null
        }
    }

    // Obtener el perfil de residente del usuario actual si existe (para límites de turnos)
    const userResidente = await prisma.residente.findFirst({
        where: { userId: session!.user.id },
        include: { 
            turnos: { 
                where: { estado: 'OCUPADO' },
                select: { id: true }
            }
        }
    })

    const currentUserResidenteId = userResidente?.id || null
    const userTurnCount = userResidente?.turnos.length || 0

    const turnos = await prisma.turnoLavanderia.findMany({
        where: residenciaId ? { residenciaId } : (isGlobal ? {} : { residenciaId: -1 }),
        include: {
            lavadora: true,
            residente: { include: { user: true } },
        },
        orderBy: [{ dia: 'asc' }, { horaInicio: 'asc' }],
    })

    const lavadoras = await prisma.lavadora.findMany({
        where: residenciaId ? { residenciaId } : (isGlobal ? {} : { residenciaId: -1 }),
        include: { residencia: { select: { nombre: true } } },
        orderBy: { nombre: 'asc' }
    })
    
    const residentes = canManage ? await prisma.residente.findMany({
        where: residenciaId ? { user: { residenciaId } } : (isGlobal ? {} : { user: { residenciaId: -1 } }),
        include: { user: true },
        orderBy: { user: { nombre: 'asc' } }
    }) : []

    const residenciasConfig = canManage ? await prisma.residencia.findMany({
        select: { id: true, nombre: true },
        orderBy: { nombre: 'asc' }
    }) : []

    const turnosByLavadora = lavadoras.map(lav => ({
        lavadora: lav,
        days: DIAS.map(dia => ({
            dia,
            turnos: turnos.filter(t => t.lavadoraId === lav.id && t.dia === dia),
        })),
    }))

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <PageHeader
                    title="Gestión de Lavandería"
                    description={residenciaId ? `Panel de turnos para sede.` : "Monitoriza y asigna turnos de uso en todas las residencias."}
                />
                <div className="flex items-center gap-4">
                    {isGlobal && (
                        <ResidenciaSelector 
                            residencias={residenciasConfig} 
                            currentId={filterResidenciaId} 
                        />
                    )}
                    {canManage && <AddLavadoraButton residencias={residenciasConfig} />}
                </div>
            </div>

            {lavadoras.length === 0 ? (
                <EmptyState
                    icon={<WashingMachine size={48} />}
                    title="No hay infraestructura"
                    description="No se encontraron lavadoras configuradas para tu acceso."
                />
            ) : (
                <div className="grid grid-cols-1 gap-10">
                    {turnosByLavadora.map(({ lavadora, days }) => (
                        <LavadoraSection 
                            key={lavadora.id}
                            lavadora={lavadora}
                            days={days}
                            session={session}
                            residentes={residentes}
                            canManage={canManage}
                            currentUserResidenteId={currentUserResidenteId}
                            currentUserId={session!.user.id}
                            userTurnCount={userTurnCount}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
