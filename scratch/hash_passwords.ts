import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('--- Iniciando migración de contraseñas ---')
  
  const users = await prisma.user.findMany()
  console.log(`Encontrados ${users.length} usuarios.`)

  let updatedCount = 0
  let skippedCount = 0

  for (const user of users) {
    // Si la contraseña ya parece un hash de bcrypt, saltar
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      skippedCount++
      continue
    }

    const hashedPassword = await bcrypt.hash(user.password, 10)
    
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })
    
    updatedCount++
    console.log(`Usuario actualizado: ${user.email}`)
  }

  console.log('--- Migración completada ---')
  console.log(`Total procesados: ${users.length}`)
  console.log(`Hasheados: ${updatedCount}`)
  console.log(`Omitidos (ya hasheados): ${skippedCount}`)
}

main()
  .catch((e) => {
    console.error('Error durante la migración:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
