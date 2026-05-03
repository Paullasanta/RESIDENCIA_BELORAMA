import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function debugUsers() {
  const users = await prisma.user.findMany({
    include: { residente: true },
    take: 10
  })

  console.log("=== REVISIÓN DE USUARIOS Y CREDENCIALES ===")
  users.forEach(u => {
    console.log(`Email: ${u.email}`)
    console.log(`DNI: ${u.dni}`)
    console.log(`Password en DB: ${u.password}`)
    console.log(`Estado Residente: ${u.residente ? (u.residente.activo ? 'ACTIVO' : 'INACTIVO') : 'SIN PERFIL'}`)
    console.log(`Match Password === DNI: ${u.password === u.dni ? 'SÍ' : 'NO'}`)
    console.log('-------------------')
  })
}

debugUsers()
