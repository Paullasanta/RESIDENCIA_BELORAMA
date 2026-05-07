import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AuthSuccessPage() {
    const session = await auth()
    
    if (!session) {
        redirect('/auth/login')
    }

    if (['ADMIN', 'SUPER_ADMIN'].includes(session.user.rol)) redirect('/modules/dashboard')
    if (session.user.rol === 'RESIDENTE') redirect('/modules/marketplace')
    if (session.user.rol === 'COCINERO') redirect('/modules/comida')
    
    redirect('/modules/dashboard')
}
