import path from 'path'

/**
 * Generates a filename based on the pattern: [prefix]_[dni]_[HHMMSS]_[DDMMYY].[ext]
 * Example: hb_45362734_115523_050526.jpg
 */
export function generateFormattedFilename(
  prefix: string,
  dni: string,
  originalName: string
): string {
  const now = new Date()
  
  // HHMMSS
  const time = now.toLocaleTimeString('es-PE', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  }).replace(/:/g, '')

  // DDMMYY
  const day = String(now.getDate()).padStart(2, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = String(now.getFullYear()).slice(-2)
  const date = `${day}${month}${year}`

  const extension = path.extname(originalName) || '.jpg'
  const cleanDni = dni.replace(/[^a-zA-Z0-9]/g, '') || '00000000'

  return `${prefix}_${cleanDni}_${time}_${date}${extension}`
}
