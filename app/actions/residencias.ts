'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const residenciaSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  direccion: z.string().min(5, 'La dirección debe ser más descriptiva'),
  capacidad: z.number().min(1, 'La capacidad debe ser al menos 1'),
  descripcion: z.string().optional(),
  activa: z.boolean().default(true),
  numHabitaciones: z.number().min(0).optional(),
  numLavadoras: z.number().min(0).optional(),
})

export async function createResidencia(data: z.infer<typeof residenciaSchema>) {
  try {
    const { numHabitaciones, numLavadoras, ...validated } = residenciaSchema.parse(data)
    
    const res = await prisma.$transaction(async (tx) => {
      const residencia = await tx.residencia.create({
        data: validated
      })

      if (numHabitaciones && numHabitaciones > 0) {
        const habitacionesData = Array.from({ length: numHabitaciones }).map((_, i) => ({
          residenciaId: residencia.id,
          numero: `${i + 101}`,
          piso: Math.floor(i / 10) + 1,
          capacidad: 1, // Default capacity
          estado: 'LIBRE' as any,
        }))

        await tx.habitacion.createMany({
          data: habitacionesData
        })
      }

      if (numLavadoras && numLavadoras > 0) {
        const lavadorasData = Array.from({ length: numLavadoras }).map((_, i) => ({
          residenciaId: residencia.id,
          nombre: `Lavadora ${i + 1}`,
          activa: true
        }))
        await tx.lavadora.createMany({
          data: lavadorasData
        })
      }

      return residencia
    })
    
    revalidatePath('/modules/residencias')
    return { success: true, data: res }
  } catch (error: any) {
    console.error('Error creating residencia:', error)
    return { success: false, error: error.message || 'Error al crear la residencia' }
  }
}

export async function updateResidencia(id: number, data: Partial<z.infer<typeof residenciaSchema>>) {
  try {
    const { numHabitaciones, numLavadoras, ...validated } = data
    
    const res = await prisma.$transaction(async (tx) => {
      const residencia = await tx.residencia.update({
        where: { id },
        data: validated
      })

      if (numHabitaciones !== undefined) {
        const currentCount = await tx.habitacion.count({ where: { residenciaId: id } })
        
        if (numHabitaciones > currentCount) {
          const needed = numHabitaciones - currentCount
          const habitacionesData = Array.from({ length: needed }).map((_, i) => ({
            residenciaId: id,
            numero: `${currentCount + i + 101}`,
            piso: Math.floor((currentCount + i) / 10) + 1,
            capacidad: 1,
            estado: 'LIBRE' as any,
          }))

          await tx.habitacion.createMany({
            data: habitacionesData
          })
        }
      }

      if (numLavadoras !== undefined) {
        const currentLavadoras = await tx.lavadora.findMany({ where: { residenciaId: id }, orderBy: { id: 'asc' } })
        const lCount = currentLavadoras.length
        
        if (numLavadoras > lCount) {
          const needed = numLavadoras - lCount
          const lavadorasData = Array.from({ length: needed }).map((_, i) => ({
            residenciaId: id,
            nombre: `Lavadora ${lCount + i + 1}`,
            activa: true
          }))
          await tx.lavadora.createMany({ data: lavadorasData })
        } else if (numLavadoras < lCount) {
          const toRemove = lCount - numLavadoras
          const lavadorasToDelete = currentLavadoras.slice(-toRemove)
          for (const lav of lavadorasToDelete) {
             await tx.turnoLavanderia.deleteMany({ where: { lavadoraId: lav.id } })
             await tx.lavadora.delete({ where: { id: lav.id } })
          }
        }
      }

      return residencia
    })
    
    revalidatePath('/modules/residencias')
    return { success: true, data: res }
  } catch (error: any) {
    console.error('Error updating residencia:', error)
    return { success: false, error: 'Error al actualizar la residencia' }
  }
}

export async function deleteResidencia(id: number) {
  try {
    const count = await prisma.residencia.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, habitaciones: true } }
      }
    })

    if (count?._count.users || count?._count.habitaciones) {
      await prisma.residencia.update({
        where: { id },
        data: { activa: false }
      })
      revalidatePath('/modules/residencias')
      return { success: true, message: 'La residencia fue desactivada porque tiene datos vinculados.' }
    }

    await prisma.residencia.delete({ where: { id } })
    revalidatePath('/modules/residencias')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: 'Error al eliminar la residencia' }
  }
}
