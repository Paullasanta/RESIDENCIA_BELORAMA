import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function Home() {
  const session = await auth()

  if (session) {
    if (session.user.rol === 'ADMIN') redirect('/admin/dashboard')
    if (session.user.rol === 'RESIDENTE') redirect('/residente/marketplace')
    if (session.user.rol === 'COCINERO') redirect('/cocinero/comida')
  }

  redirect('/login')
}