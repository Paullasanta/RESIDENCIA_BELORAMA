import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const { id } = await params

  if (!session || session.user.id !== Number(id)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: Number(id) },
    include: {
      role: true,
      residencia: true,
      residente: {
        include: {
          habitacion: true,
          pagos: true
        }
      }
    }
  })

  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  // Quitar la contraseña por seguridad antes de enviar
  const { password, ...userWithoutPassword } = user
  return NextResponse.json(userWithoutPassword)
}
