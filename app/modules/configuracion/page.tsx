import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { ConfigForm } from '@/components/forms/ConfigForm'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ConfigTabs } from '@/components/admin/ConfigTabs'
import { StaffManager } from '@/components/admin/StaffManager'
import { RolesManager } from '@/components/admin/RolesManager'
import { getStaff } from '@/app/actions/usuarios'
import { getRoles } from '@/app/actions/roles'

export default async function ConfiguracionPage() {
    const session = await auth()
    if (session?.user.rol !== 'ADMIN') {
        redirect('/modules/dashboard')
    }

    // 1. Datos para Tab: Sistema (Identidad)
    const configs = await prisma.configuracion.findMany()
    const configMap = configs.reduce((acc, curr) => ({
        ...acc,
        [curr.clave]: curr.valor
    }), {} as Record<string, string>)

    const initialConfig = {
        SYSTEM_NAME: 'Belorama',
        SUPPORT_EMAIL: 'soporte@belorama.com',
        FOOTER_TEXT: `© ${new Date().getFullYear()} Belorama - Gestión de Residencias`,
        ...configMap
    }

    // 2. Datos para Tab: Personal (Staff)
    const staff = await getStaff()
    const roles = await getRoles()
    const residencias = await prisma.residencia.findMany({ select: { id: true, nombre: true } })

    // 3. Datos para Tab: Roles (Seguridad)
    const allPermissions = await prisma.permission.findMany({ orderBy: { key: 'asc' } })

    return (
        <div className="space-y-12 animate-in fade-in zoom-in-95 duration-700">
            <PageHeader
                title="Centro de Control"
                description="Gestión administrativa, personal y seguridad del sistema."
            />
            
            <ConfigTabs 
                sistema={<ConfigForm initialConfig={initialConfig} />}
                personal={
                    <StaffManager 
                        staff={staff as any} 
                        roles={roles} 
                        residencias={residencias} 
                    />
                }
                roles={
                    <RolesManager 
                        roles={roles as any} 
                        allPermissions={allPermissions} 
                    />
                }
            />
        </div>
    )
}
