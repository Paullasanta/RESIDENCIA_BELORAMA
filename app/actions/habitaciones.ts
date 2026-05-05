'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const habitacionSchema = z.object({
  residenciaId: z.number(),
  numero: z.string().min(1, 'El número de habitación es requerido'),
  piso: z.number().min(0),
  capacidad: z.number().min(1),
  estado: z.enum(['LIBRE', 'OCUPADO', 'RESERVADO', 'POR_LIBERARSE']),
})

export async function createHabitacion(data: z.infer<typeof habitacionSchema>) {
  try {
    const validated = habitacionSchema.parse(data)
    
    // Verificar capacidad de la residencia
    const residencia = await prisma.residencia.findUnique({
        where: { id: validated.residenciaId },
        include: { _count: { select: { habitaciones: true } } }
    })

    if (!residencia) throw new Error('Residencia no encontrada')
    
    // Si queremos respetar el límite de "capacidad" (que suele ser de personas, no de habitaciones)
    // Pero si el usuario dice "respetando el limite de lo que esta en residencia", 
    // tal vez se refiera a la capacidad total de personas.
    
    const res = await prisma.habitacion.create({
      data: validated
    })
    
    revalidatePath(`/modules/residencias/${validated.residenciaId}`)
    return { success: true, data: res }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al crear la habitación' }
  }
}

export async function importHabitacionesCSV(residenciaId: number, rows: any[]) {
  try {
    const statusMap: Record<string, 'LIBRE' | 'OCUPADO' | 'RESERVADO' | 'POR_LIBERARSE'> = {
        'libre': 'LIBRE',
        'ocupado': 'OCUPADO',
        'reservado': 'RESERVADO',
        'por liberarse': 'POR_LIBERARSE',
        'free': 'LIBRE',
        'occupied': 'OCUPADO'
    }

    const habitacionesData = rows.map(row => ({
        residenciaId,
        numero: String(row.habitacion || row.room),
        piso: Number(row.piso || row.floor || 1),
        capacidad: Number(row.capacidad || 1),
        estado: statusMap[String(row.disponibilidad || row.status).toLowerCase()] || 'LIBRE'
    }))

    await prisma.habitacion.createMany({
        data: habitacionesData,
        skipDuplicates: true
    })

    revalidatePath(`/modules/residencias/${residenciaId}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: 'Error al importar las habitaciones.' }
  }
}

export async function updateHabitacion(id: number, data: Partial<z.infer<typeof habitacionSchema>>) {
  try {
    // Restricción: No permitir OCUPADO manualmente
    if (data.estado === 'OCUPADO') {
      throw new Error('El estado OCUPADO solo se asigna automáticamente al registrar un residente.')
    }

    const res = await prisma.habitacion.update({
      where: { id },
      data
    })
    revalidatePath(`/modules/residencias/${res.residenciaId}`)
    return { success: true, data: res }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al actualizar la habitación' }
  }
}

/**
 * Función que revisa y actualiza los estados de las habitaciones dinámicamente.
 * Se puede llamar al cargar el dashboard o la lista de habitaciones.
 */
export async function checkHabitacionesStatus() {
  try {
    const today = new Date()
    today.setUTCHours(0,0,0,0)
    
    const limitDate = new Date(today)
    limitDate.setDate(today.getDate() + 15)

    // Buscar habitaciones ocupadas con residentes cuya fecha final esté cerca
    const habitacionesOcupadas = await prisma.habitacion.findMany({
      where: { estado: 'OCUPADO' },
      include: {
        residentes: {
          where: { activo: true },
          orderBy: { fechaFinal: 'asc' },
          take: 1
        }
      }
    })

    for (const hab of habitacionesOcupadas) {
      const residente = hab.residentes[0]
      if (residente && residente.fechaFinal) {
        const fechaFinal = new Date(residente.fechaFinal)
        
        // Si falta menos de 15 días y está ocupada -> POR_LIBERARSE
        if (fechaFinal <= limitDate && hab.estado === 'OCUPADO') {
          await prisma.habitacion.update({
            where: { id: hab.id },
            data: { estado: 'POR_LIBERARSE' }
          })
        }
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error checking room status:', error)
    return { success: false }
  }
}

export async function getResidentesParaAsignar(residenciaId: number) {
  return await prisma.residente.findMany({
    where: { 
      user: { residenciaId },
      activo: true
    },
    include: {
      user: true,
      habitacion: true
    },
    orderBy: { user: { nombre: 'asc' } }
  })
}

export async function assignResidenteToHabitacion(residenteId: number, habitacionId: number | null, residenciaId: number) {
  try {
    await prisma.$transaction(async (tx) => {
      const actual = await tx.residente.findUnique({ where: { id: residenteId } })
      if (!actual) throw new Error('Residente no encontrado')

      // Liberar la anterior si existe
      if (actual.habitacionId && actual.habitacionId !== habitacionId) {
        await tx.habitacion.update({
          where: { id: actual.habitacionId },
          data: { estado: 'LIBRE' }
        })
      }

      // Ocupar la nueva
      if (habitacionId) {
        await tx.habitacion.update({
          where: { id: habitacionId },
          data: { estado: 'OCUPADO' }
        })
      }

      await tx.residente.update({
        where: { id: residenteId },
        data: { habitacionId }
      })
    })

    revalidatePath(`/modules/residencias/${residenciaId}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

import { writeFile, unlink, mkdir } from 'fs/promises'
import path from 'path'

export async function uploadHabitacionFotos(habitacionId: number, residenciaId: number, formData: FormData) {
  try {
    const files = formData.getAll('fotos') as File[]
    if (files.length === 0) return { success: false, error: 'No se encontraron archivos' }

    const savedUrls: string[] = []

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const filename = `${Date.now()}_${file.name.replace(/\\s+/g, '_')}`
      // Asegurar que el directorio existe con permisos de lectura (755)
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'habitaciones')
      await mkdir(uploadDir, { recursive: true, mode: 0o755 })

      const filepath = path.join(uploadDir, filename)
      
      await writeFile(filepath, buffer, { mode: 0o644 })
      console.log('📁 Foto guardada en:', filepath)
      savedUrls.push(`/uploads/habitaciones/${filename}`)
    }

    const hab = await prisma.habitacion.findUnique({ where: { id: habitacionId } })
    const nuevasFotos = [...(hab?.fotos || []), ...savedUrls]

    await prisma.habitacion.update({
      where: { id: habitacionId },
      data: { fotos: nuevasFotos }
    })

    revalidatePath(`/modules/residencias/${residenciaId}`)
    return { success: true, fotos: nuevasFotos }
  } catch (error: any) {
    console.error('Error uploading:', error)
    return { success: false, error: 'Error subiendo fotos al servidor estático.' }
  }
}

export async function deleteHabitacionFoto(habitacionId: number, residenciaId: number, fotoUrl: string) {
  try {
    const filename = fotoUrl.split('/').pop()
    if (filename) {
      const filepath = path.join(process.cwd(), 'public', 'uploads', 'habitaciones', filename)
      try { await unlink(filepath) } catch (e) { /* file might strictly not exist anymore */ }
    }

    const hab = await prisma.habitacion.findUnique({ where: { id: habitacionId } })
    const remaining = (hab?.fotos || []).filter(f => f !== fotoUrl)

    await prisma.habitacion.update({
      where: { id: habitacionId },
      data: { fotos: remaining }
    })

    revalidatePath(`/modules/residencias/${residenciaId}`)
    return { success: true, fotos: remaining }
  } catch (error: any) {
    return { success: false, error: 'Error eliminando la foto.' }
  }
}
