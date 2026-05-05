import { NextRequest, NextResponse } from 'next/server'
import { saveUploadedFile } from '@/lib/upload-service'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || 'otros'
    const prefix = (formData.get('prefix') as string) || 'up'
    const dni = (formData.get('dni') as string) || '00000000'

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 })
    }

    // Usar el servicio unificado para guardar el archivo
    const { url, filename } = await saveUploadedFile(file, prefix, dni, folder)

    return NextResponse.json({ 
        url,
        name: filename
    })
  } catch (error: any) {
    console.error('Error in upload API:', error)
    return NextResponse.json({ error: 'Error al procesar la subida' }, { status: 500 })
  }
}
