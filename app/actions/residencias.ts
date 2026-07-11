'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const residenciaSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  direccion: z.string().min(5, 'La dirección debe ser más descriptiva'),
  capacidad: z.number().min(1, 'La capacidad debe ser al menos 1'),
  descripcion: z.string().nullable().optional(),
  activa: z.boolean().default(true),
  numHabitaciones: z.number().min(0).optional(),
  numLavadoras: z.number().min(0).optional(),
})

export async function createResidencia(data: z.infer<typeof residenciaSchema>) {
  try {
    const validatedData = residenciaSchema.parse(data)
    const { numHabitaciones, numLavadoras, ...validated } = validatedData
    
    // Limpiar strings
    validated.nombre = validated.nombre.trim()
    validated.direccion = validated.direccion.trim()
    if (typeof validated.descripcion === 'string') {
      validated.descripcion = validated.descripcion.trim()
    }
    
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
    // Validar con el esquema parcial
    const validatedData = residenciaSchema.partial().parse(data)
    const { numHabitaciones, numLavadoras, ...validated } = validatedData
    
    // Limpiar strings si existen
    if (validated.nombre) validated.nombre = validated.nombre.trim()
    if (validated.direccion) validated.direccion = validated.direccion.trim()
    if (typeof validated.descripcion === 'string') {
      validated.descripcion = validated.descripcion.trim()
    }

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
        } else if (numHabitaciones < currentCount) {
          // Validar que no estemos intentando reducir por debajo de las ocupadas/reservadas
          const occupiedCount = await tx.habitacion.count({
            where: { residenciaId: id, estado: { not: 'LIBRE' } }
          })

          if (numHabitaciones < occupiedCount) {
            throw new Error(`Hay ${occupiedCount} habitaciones ocupadas o reservadas. No puedes reducir la capacidad por debajo de ese número.`)
          }

          const toRemove = currentCount - numHabitaciones
          // Solo podemos eliminar las que están LIBRES
          const libres = await tx.habitacion.findMany({
            where: { residenciaId: id, estado: 'LIBRE' },
            orderBy: { numero: 'desc' },
            take: toRemove
          })

          if (libres.length > 0) {
            const libreIds = libres.map(h => h.id)
            
            // 1. Eliminar publicaciones asociadas
            await tx.publicacionHabitacion.deleteMany({
              where: { habitacionId: { in: libreIds } }
            })
            
            // 2. Eliminar reservas asociadas
            await tx.reserva.deleteMany({
              where: { habitacionId: { in: libreIds } }
            })
            
            // 3. Desvincular residentes (poner habitacionId en null)
            await tx.residente.updateMany({
              where: { habitacionId: { in: libreIds } },
              data: { habitacionId: null }
            })
            
            // 4. Eliminar las habitaciones
            await tx.habitacion.deleteMany({
              where: { id: { in: libreIds } }
            })
          }
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
    return { success: false, error: error.message || 'Error al actualizar la residencia' }
  }
}

export async function deleteResidencia(id: number) {
  try {
    // Siempre desactivamos (Soft Delete) por seguridad e historial
    await prisma.residencia.update({
      where: { id },
      data: { activa: false }
    })
    
    revalidatePath('/modules/residencias')
    return { success: true, message: 'Residencia desactivada correctamente.' }
  } catch (error: any) {
    return { success: false, error: 'Error al desactivar la residencia' }
  }
}

export async function activateResidencia(id: number) {
  try {
    await prisma.residencia.update({
      where: { id },
      data: { activa: true }
    })
    
    revalidatePath('/modules/residencias')
    return { success: true, message: 'Residencia activada correctamente.' }
  } catch (error: any) {
    return { success: false, error: 'Error al activar la residencia' }
  }
}
