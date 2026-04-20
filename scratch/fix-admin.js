const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const email = 'admin@belorama.com'
  const dni = '12345678' // DNI sugerido
  
  const role = await prisma.role.findFirst({ where: { name: 'ADMIN' } })
  if (!role) {
    console.error('Role ADMIN not found')
    return
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      dni,
      password: dni, // Password igual al DNI
      roleId: role.id,
      nombre: 'Admin Belorama'
    },
    create: {
      email,
      dni,
      password: dni,
      nombre: 'Admin Belorama',
      roleId: role.id
    }
  })

  console.log('User updated/created:', user)
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
