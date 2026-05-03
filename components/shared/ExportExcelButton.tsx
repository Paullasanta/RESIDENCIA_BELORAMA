'use client'

import { Download, Loader2 } from 'lucide-react'
import { useState } from 'react'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

interface ExportExcelButtonProps {
    data: any[]
    filename: string
    sheetName?: string
    // exceljs usa un formato un poco diferente para columnas
    columns?: { header: string, key: string, width: number }[]
}

export function ExportExcelButton({ data, filename, sheetName = 'Datos', columns }: ExportExcelButtonProps) {
    const [loading, setLoading] = useState(false)

    const handleExport = async () => {
        if (!data || data.length === 0) return
        setLoading(true)
        
        try {
            const workbook = new ExcelJS.Workbook()
            const worksheet = workbook.addWorksheet(sheetName)

            // 1. Configurar Columnas
            if (columns) {
                worksheet.columns = columns
            } else if (data.length > 0) {
                const keys = Object.keys(data[0])
                worksheet.columns = keys.map(key => ({ header: key, key, width: 20 }))
            }

            // 2. Estilo del Encabezado (Premium Green)
            const headerRow = worksheet.getRow(1)
            headerRow.values = worksheet.columns.map(c => c.header) as any
            
            headerRow.eachCell((cell) => {
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF1D9E75' } // Verde Belorama
                }
                cell.alignment = { vertical: 'middle', horizontal: 'center' }
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FF167E5D' } },
                    left: { style: 'thin', color: { argb: 'FF167E5D' } },
                    bottom: { style: 'thin', color: { argb: 'FF167E5D' } },
                    right: { style: 'thin', color: { argb: 'FF167E5D' } }
                }
            })
            headerRow.height = 25

            // 3. Agregar Datos
            worksheet.addRows(data)

            // 4. Estilos de Filas y Celdas
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return // Saltar encabezado

                row.eachCell((cell) => {
                    cell.font = { size: 10, color: { argb: 'FF374151' } }
                    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFF3F4F6' } },
                        left: { style: 'thin', color: { argb: 'FFF3F4F6' } },
                        bottom: { style: 'thin', color: { argb: 'FFF3F4F6' } },
                        right: { style: 'thin', color: { argb: 'FFF3F4F6' } }
                    }
                })

                // Filas alternas (Zebra)
                if (rowNumber % 2 === 0) {
                    row.eachCell((cell) => {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFF9FAFB' }
                        }
                    })
                }
                
                row.height = 22
            })

            // 5. Ajustes finales y descarga
            const buffer = await workbook.xlsx.writeBuffer()
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`)
        } catch (error) {
            console.error('Error generando Excel:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <button 
            onClick={handleExport}
            disabled={loading || !data || data.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-100 rounded-xl text-[10px] font-black text-gray-400 hover:text-[#1D9E75] hover:border-[#1D9E75] transition-all shadow-sm disabled:opacity-50"
        >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            EXCEL
        </button>
    )
}
