import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Crear un nombre de archivo único
    const originalName = file.name
    const extension = path.extname(originalName) || '.jpg'
    const fileName = `${randomUUID()}${extension}`
    
    // Ruta donde se guardará el archivo
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    const filePath = path.join(uploadDir, fileName)

    // Asegurar que el directorio existe con permisos de lectura (755)
    await (await import('fs/promises')).mkdir(uploadDir, { recursive: true, mode: 0o755 })

    await writeFile(filePath, buffer, { mode: 0o644 })

    return NextResponse.json({ 
        url: `/uploads/${fileName}`,
        name: originalName
    })
  } catch (error: any) {
    console.error('Error in upload API:', error)
    return NextResponse.json({ error: 'Error al procesar la subida' }, { status: 500 })
  }
}
