import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { generateFormattedFilename } from './upload-utils'

/**
 * Unified service to save uploaded files.
 * Organizes files into folders by module (habitaciones, productos, etc.)
 */
export async function saveUploadedFile(file: File, prefix: string, dni: string, folder: string) {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const filename = generateFormattedFilename(prefix, dni, file.name)
  
  // Base directory for all uploads organized by module
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder)
  
  // Ensure the directory exists
  await mkdir(uploadDir, { recursive: true, mode: 0o755 })

  const filePath = path.join(uploadDir, filename)
  
  // Save the file
  await writeFile(filePath, buffer, { mode: 0o644 })
  console.log(`✅ Archivo [${prefix}] guardado en [${folder}] en: ${filePath}`)

  return {
    url: `/uploads/${folder}/${filename}`,
    filename
  }
}
