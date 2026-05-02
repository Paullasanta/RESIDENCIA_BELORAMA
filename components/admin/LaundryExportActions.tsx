'use client'

import { ExportExcelButton } from '@/components/shared/ExportExcelButton'

export function LaundryExportActions({ lavadora, days }: { lavadora: any, days: any[] }) {
    const data = days.flatMap(day => 
        day.turnos.map((t: any) => ({
            'Lavadora': lavadora.nombre,
            'Sede': lavadora.residencia.nombre,
            'Día': day.dia,
            'Inicio': t.horaInicio,
            'Fin': t.horaFin,
            'Estado': t.estado,
            'Usuario': t.residente?.user?.nombre || (t.estado === 'LIBRE' ? '—' : 'Solicitado')
        }))
    )

    const columns = [
        { header: 'Lavadora', key: 'Lavadora', width: 25 },
        { header: 'Sede', key: 'Sede', width: 25 },
        { header: 'Día', key: 'Día', width: 15 },
        { header: 'Inicio', key: 'Inicio', width: 12 },
        { header: 'Fin', key: 'Fin', width: 12 },
        { header: 'Estado', key: 'Estado', width: 15 },
        { header: 'Usuario', key: 'Usuario', width: 30 }
    ]

    return (
        <ExportExcelButton 
            data={data} 
            filename={`Reporte_Lavanderia_${lavadora.nombre}`} 
            sheetName="Turnos"
            columns={columns}
        />
    )
}
