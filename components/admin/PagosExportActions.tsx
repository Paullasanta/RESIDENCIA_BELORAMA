'use client'

import { ExportExcelButton } from '@/components/shared/ExportExcelButton'

export function PagosExportActions({ residentesPagos }: { residentesPagos: any[] }) {
    const data = residentesPagos.flatMap(res => 
        res.pagos.map((p: any) => ({
            'Residente': res.residente.user.nombre,
            'Email': res.residente.user.email,
            'Residencia': res.residente.habitacion?.residencia?.nombre || '—',
            'Habitación': res.residente.habitacion?.numero || '—',
            'Concepto': p.concepto,
            'Monto Total': p.monto,
            'Monto Pagado': p.montoPagado,
            'Saldo Pendiente': p.monto - p.montoPagado,
            'Estado': p.estado,
            'Vencimiento': p.fechaVencimiento ? new Date(p.fechaVencimiento).toLocaleDateString('es-MX') : '—',
            'Fecha Pago': p.fechaPago ? new Date(p.fechaPago).toLocaleDateString('es-MX') : '—',
            'Método': p.metodoPago || '—'
        }))
    )

    const columns = [
        { header: 'Residente', key: 'Residente', width: 30 },
        { header: 'Email', key: 'Email', width: 30 },
        { header: 'Residencia', key: 'Residencia', width: 20 },
        { header: 'Habitación', key: 'Habitación', width: 12 },
        { header: 'Concepto', key: 'Concepto', width: 35 },
        { header: 'Monto Total', key: 'Monto Total', width: 15 },
        { header: 'Monto Pagado', key: 'Monto Pagado', width: 15 },
        { header: 'Saldo Pendiente', key: 'Saldo Pendiente', width: 15 },
        { header: 'Estado', key: 'Estado', width: 15 },
        { header: 'Vencimiento', key: 'Vencimiento', width: 15 },
        { header: 'Fecha Pago', key: 'Fecha Pago', width: 15 },
        { header: 'Método', key: 'Método', width: 15 }
    ]

    return (
        <ExportExcelButton 
            data={data} 
            filename="Reporte_Pagos" 
            sheetName="Historial de Pagos"
            columns={columns}
        />
    )
}
