'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createResidente, updateResidente } from '@/app/actions/residentes'
import { Button } from '@/components/ui/button'
import { Loader2, Save, X, Upload, Check } from 'lucide-react'

interface ResidenteFormProps {
  residencias: any[]
  initialData?: any
}

export function ResidenteForm({ residencias, initialData }: ResidenteFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [residenciaId, setResidenciaId] = useState(initialData?.habitacion?.residenciaId?.toString() || initialData?.user?.residenciaId?.toString() || '')
  const [habitacionId, setHabitacionId] = useState(initialData?.habitacionId || '')

  // Fechas y Duración
  const [fechaIngreso, setFechaIngreso] = useState(
    initialData?.fechaIngreso
      ? new Date(initialData.fechaIngreso).toISOString().split('T')[0]
      : (() => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().split('T')[0] })()
  )
  const [fechaFinal, setFechaFinal] = useState(
    initialData?.fechaFinal
      ? new Date(initialData.fechaFinal).toISOString().split('T')[0]
      : ''
  )
  const [diaPago, setDiaPago] = useState(
    initialData?.diaPago || (initialData?.fechaIngreso ? new Date(initialData.fechaIngreso).getDate() : new Date().getDate())
  )
  const [duracion, setDuracion] = useState('')

  // Estados de Información Personal
  const [dni, setDni] = useState(initialData?.user?.dni || '')
  const [nombre, setNombre] = useState(initialData?.user?.nombre || '')
  const [apellidoPaterno, setApellidoPaterno] = useState(initialData?.user?.apellidoPaterno || '')
  const [apellidoMaterno, setApellidoMaterno] = useState(initialData?.user?.apellidoMaterno || '')
  const [telefono, setTelefono] = useState(initialData?.user?.telefono || '')
  const [email, setEmail] = useState(initialData?.user?.email || '')

  // Estados de Emergencia
  const [emergenciaNombre, setEmergenciaNombre] = useState(initialData?.user?.emergenciaNombre || '')
  const [emergenciaTelefono, setEmergenciaTelefono] = useState(initialData?.user?.emergenciaTelefono || '')
  const [emergenciaParentesco, setEmergenciaParentesco] = useState(initialData?.user?.emergenciaParentesco || '')
  const [fechaNacimiento, setFechaNacimiento] = useState(
    initialData?.user?.fechaNacimiento
      ? new Date(initialData.user.fechaNacimiento).toISOString().split('T')[0]
      : ''
  )

  // Estados de Salud
  const [alergias, setAlergias] = useState(initialData?.alergias || '')
  const [restricciones, setRestricciones] = useState(initialData?.restriccionesAlimentarias || '')

  useEffect(() => {
    if (fechaIngreso && fechaFinal) {
      // Usar UTC para evitar desfases de zona horaria al comparar strings de fecha
      const start = new Date(fechaIngreso + 'T12:00:00Z')
      const end = new Date(fechaFinal + 'T12:00:00Z')
      if (end >= start) {
        let months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + (end.getUTCMonth() - start.getUTCMonth())
        let days = end.getUTCDate() - start.getUTCDate()
        if (days < 0) {
          months--
          const prevMonth = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 0))
          days += prevMonth.getUTCDate()
        }

        let text = ''
        if (months > 0) text += `${months} mes${months !== 1 ? 'es' : ''}`
        if (months > 0 && days > 0) text += ' y '
        if (days > 0) text += `${days} día${days !== 1 ? 's' : ''}`
        if (months === 0 && days === 0) text = 'Mismo día'

        setDuracion(text || '0 días')
      } else {
        setDuracion('')
      }
    } else {
      setDuracion('')
    }
  }, [fechaIngreso, fechaFinal])

  // Estados para confirmación de pago
  const [pagoConfirmado, setPagoConfirmado] = useState(false)
  const [montoMensualInput, setMontoMensualInput] = useState(initialData?.montoMensual || 0)
  const [montoGarantiaInput, setMontoGarantiaInput] = useState(initialData?.montoGarantia || 0)
  const [cuotasGarantiaInput, setCuotasGarantiaInput] = useState(
    initialData?.pagos?.filter((p: any) => p.concepto.includes('Garantía')).length || 1
  )
  const [montoGarantiaPrimerPago, setMontoGarantiaPrimerPago] = useState(0)

  // Sincronizar monto inicial de garantía cuando cambian el total o las cuotas
  useEffect(() => {
    if (montoGarantiaInput > 0 && cuotasGarantiaInput > 0) {
      setMontoGarantiaPrimerPago(Number((montoGarantiaInput / cuotasGarantiaInput).toFixed(2)))
    } else {
      setMontoGarantiaPrimerPago(0)
    }
  }, [montoGarantiaInput, cuotasGarantiaInput])

  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  // Filtrar habitaciones disponibles de la residencia seleccionada
  const residenciaSeleccionada = residencias.find(r => r.id.toString() === residenciaId.toString())
  const habitacionesDisponibles = residenciaSeleccionada?.habitaciones || []

  async function handleSubmit(formData: FormData) {
    setError(null)
    setUploading(true)

    try {
      let comprobanteUrl = null

      // Si se confirma el pago y hay un archivo, subirlo primero
      if (pagoConfirmado && comprobanteFile) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', comprobanteFile)

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData
        })

        if (!uploadRes.ok) {
          throw new Error('Error al subir el comprobante')
        }

        const uploadData = await uploadRes.json()
        comprobanteUrl = uploadData.url
      }

      const data = Object.fromEntries(formData.entries())

      // Añadir datos de confirmación
      const finalData = {
        ...data,
        pagoConfirmado: pagoConfirmado,
        comprobanteUrl: comprobanteUrl
      }

      startTransition(async () => {
        const result = initialData
          ? await updateResidente(initialData.id, finalData)
          : await createResidente(finalData)

        if (result.success) {
          router.push('/modules/residentes')
          router.refresh()
        } else {
          setError(result.error)
          setUploading(false)
        }
      })
    } catch (err: any) {
      setError(err.message || 'Error al procesar el formulario')
      setUploading(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-8 bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/50">
      {error && (
        <div className="p-5 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in shake duration-500">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Sección: Información Personal */}
        <div className="space-y-6 col-span-full">
          <h3 className="text-sm font-black text-[#1D9E75] uppercase tracking-[0.2em] mb-2">Información Personal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">DNI / ID Documento</label>
              <input
                name="dni"
                value={dni}
                onChange={(e) => setDni(e.target.value.replace(/[^0-9]/g, ''))}
                required
                pattern="[0-9]*"
                inputMode="numeric"
                className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                placeholder="Ej. 74582104"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Nombres</label>
              <input
                name="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                placeholder="Ej. Juan"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Apellido Paterno</label>
              <input
                name="apellidoPaterno"
                value={apellidoPaterno}
                onChange={(e) => setApellidoPaterno(e.target.value)}
                required
                className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                placeholder="Ej. Pérez"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Apellido Materno</label>
              <input
                name="apellidoMaterno"
                value={apellidoMaterno}
                onChange={(e) => setApellidoMaterno(e.target.value)}
                required
                className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                placeholder="Ej. Gómez"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Teléfono</label>
              <input
                name="telefono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value.replace(/[^0-9]/g, ''))}
                pattern="[0-9]{9}"
                maxLength={9}
                inputMode="numeric"
                className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                placeholder="Ej. 999888777"
              />
              <p className="text-[9px] text-gray-400 font-bold uppercase mt-1 ml-1 tracking-tighter">* Exactamente 9 números</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
              <input
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                placeholder="juan@email.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Fecha de Nacimiento</label>
              <input
                name="fechaNacimiento"
                type="date"
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
              />
            </div>

            {initialData && (
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                  Contraseña <span className="text-[10px] font-bold text-[#EF9F27] ml-2">(Opcional para cambio)</span>
                </label>
                <input
                  name="password"
                  type="password"
                  className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                  placeholder="••••••••"
                />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Residencia</label>
          <select
            name="residenciaId"
            value={residenciaId}
            onChange={(e) => {
              setResidenciaId(e.target.value)
              setHabitacionId('') // Reset habitacion when residencia changes
            }}
            required
            className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-bold text-gray-700 appearance-none cursor-pointer"
          >
            <option value="">Seleccionar residencia...</option>
            {residencias.map((res) => (
              <option key={res.id} value={res.id}>{res.nombre}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Habitación</label>
          <select
            name="habitacionId"
            value={habitacionId}
            onChange={(e) => setHabitacionId(e.target.value)}
            required
            disabled={!residenciaId}
            className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-bold text-gray-700 appearance-none cursor-pointer disabled:opacity-50"
          >
            <option value="">Seleccionar habitación...</option>
            {initialData?.habitacion && !habitacionesDisponibles.find((h: any) => h.id.toString() === initialData.habitacionId.toString()) && (
              <option value={initialData.habitacionId.toString()}>
                Hab. {initialData.habitacion.numero} (Actual)
              </option>
            )}
            {habitacionesDisponibles.map((hab: any) => (
              <option key={hab.id} value={hab.id}>Hab. {hab.numero} (Piso {hab.piso})</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Fecha de Inicio</label>
          <input
            name="fechaIngreso"
            type="date"
            value={fechaIngreso}
            onChange={(e) => {
              const val = e.target.value
              setFechaIngreso(val)
              if (val) {
                const day = parseInt(val.split('-')[2])
                if (!isNaN(day)) setDiaPago(day)
              }
            }}
            required
            className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-bold text-gray-700 cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Fecha de Fin (Salida)</label>
          <div className="relative">
            <input
              name="fechaFinal"
              type="date"
              value={fechaFinal}
              min={fechaIngreso}
              onChange={(e) => setFechaFinal(e.target.value)}
              required
              className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-bold text-gray-700 cursor-pointer"
            />
            {duracion && (
              <div className="mt-1.5 flex justify-end">
                <span className="px-3 py-1 bg-[#1D9E75] text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-sm animate-in fade-in slide-in-from-top-1 duration-300">
                  Duración: {duracion}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Día de Pago Mensual</label>
          <input
            name="diaPago"
            type="number"
            min="1"
            max="31"
            value={diaPago}
            onChange={(e) => {
              const val = parseInt(e.target.value)
              if (!isNaN(val) && val >= 1 && val <= 31) {
                setDiaPago(val)
              } else if (e.target.value === '') {
                setDiaPago(0)
              }
            }}
            required
            className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-bold text-gray-700"
            placeholder="Ej. 5"
          />
          <p className="text-[9px] text-gray-400 font-bold uppercase mt-1 ml-1 tracking-tighter">
            * Si el mes tiene menos días, se cobrará el último día del mes.
          </p>
        </div>

        <div className="pt-8 mt-4 border-t border-gray-50 col-span-full">
          <h3 className="text-sm font-black text-[#EF9F27] uppercase tracking-[0.2em] mb-2">Configuración Financiera</h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">
            {initialData ? 'Actualiza los montos base de renta y garantía.' : 'Se generarán los registros de deuda correspondientes.'}
            {!initialData && <><br /><span className="text-[#1D9E75]">Aviso: La contraseña inicial será el DNI del residente.</span></>}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Monto Mensual (Renta)</label>
          <div className="relative group/input">
            <span className="absolute left-5 inset-y-0 flex items-center text-gray-300 font-black group-focus-within/input:text-[#1D9E75] transition-colors">$</span>
            <input
              name="montoMensual"
              type="number"
              step="0.01"
              required
              value={montoMensualInput || ''}
              onChange={(e) => setMontoMensualInput(e.target.value === '' ? 0 : Number(e.target.value))}
              className="w-full pl-10 pr-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-black text-gray-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0.00"
              onWheel={(e) => (e.target as HTMLElement).blur()}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Garantía (Total)</label>
          <div className="relative group/input">
            <span className="absolute left-5 inset-y-0 flex items-center text-gray-300 font-black group-focus-within/input:text-[#1D9E75] transition-colors">$</span>
            <input
              name="montoGarantia"
              type="number"
              step="0.01"
              required
              value={montoGarantiaInput || ''}
              onChange={(e) => setMontoGarantiaInput(e.target.value === '' ? 0 : Number(e.target.value))}
              className="w-full pl-10 pr-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-black text-gray-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0.00"
              onWheel={(e) => (e.target as HTMLElement).blur()}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Dividir Garantía en</label>
          <select
            name="cuotasGarantia"
            value={cuotasGarantiaInput}
            onChange={(e) => setCuotasGarantiaInput(Number(e.target.value))}
            className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-black text-gray-700 appearance-none cursor-pointer"
          >
            {[1, 2, 3, 4, 5, 6].map(n => (
              <option key={n} value={n}>{n} {n === 1 ? 'parte' : 'partes'}</option>
            ))}
          </select>
        </div>

        {initialData && (
          <div className="col-span-full pt-4">
            <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Estado de Pagos Registrados</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['Alquiler Inicial', 'Garantía'].map(concepto => {
                  const pago = initialData.pagos?.find((p: any) => p.concepto === concepto)
                  return (
                    <div key={concepto} className="bg-white p-4 rounded-2xl border border-gray-50 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">{concepto}</p>
                        <p className="text-xs font-black text-gray-700">S/ {pago?.monto?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${pago?.estado === 'PAGADO' ? 'bg-green-100 text-green-600' :
                          pago?.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-600' :
                            pago?.estado === 'EN_REVISION' ? 'bg-blue-100 text-blue-600' :
                              'bg-gray-100 text-gray-400'
                        }`}>
                        {pago?.estado || 'NO GENERADO'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {!initialData && (
          <>
            {/* Sección: Confirmación de Pago */}
            <div className="col-span-full pt-8 mt-4 border-t border-gray-50">
              <div className="bg-[#1D9E75]/5 p-8 rounded-3xl border border-[#1D9E75]/10 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-[#1D9E75] uppercase tracking-widest mb-1">Confirmación de Pago Entrada</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">¿Confirmar pago de Renta + Garantía (Parte 1)?</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-[10px] font-black text-[#1D9E75] bg-white px-3 py-1 rounded-lg shadow-sm border border-[#1D9E75]/10 mb-2">
                      MONTO A PAGAR: S/ {(montoMensualInput + montoGarantiaPrimerPago).toFixed(2)}
                    </div>
                    <button
                      type="button"
                      onClick={() => setPagoConfirmado(!pagoConfirmado)}
                      className={`w-14 h-8 rounded-full transition-all relative ${pagoConfirmado ? 'bg-[#1D9E75]' : 'bg-gray-200'}`}
                    >
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${pagoConfirmado ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                </div>

                {pagoConfirmado && (
                  <div className="pt-4 animate-in slide-in-from-top-4 duration-300">
                    <div className="bg-white/50 rounded-2xl p-6 mb-4 border border-[#1D9E75]/20 space-y-4">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Ajuste de Montos a Confirmar:</p>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-gray-400 uppercase">Renta a Confirmar</label>
                          <div className="relative">
                            <span className="absolute left-3 inset-y-0 flex items-center text-gray-300 text-[10px]">S/</span>
                            <input
                              type="number"
                              value={montoMensualInput}
                              onChange={(e) => setMontoMensualInput(Number(e.target.value))}
                              className="w-full pl-7 pr-3 py-2 bg-white border border-gray-100 rounded-xl text-xs font-black text-[#072E1F] outline-none focus:border-[#1D9E75] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              onWheel={(e) => (e.target as HTMLElement).blur()}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-gray-400 uppercase">Garantía Parte 1 (Editable)</label>
                          <div className="relative">
                            <span className="absolute left-3 inset-y-0 flex items-center text-gray-300 text-[10px]">S/</span>
                            <input
                              name="montoGarantiaPrimerPago"
                              type="number"
                              value={montoGarantiaPrimerPago || ''}
                              onChange={(e) => setMontoGarantiaPrimerPago(e.target.value === '' ? 0 : Number(e.target.value))}
                              className="w-full pl-7 pr-3 py-2 bg-white border border-gray-100 rounded-xl text-xs font-black text-[#1D9E75] outline-none focus:border-[#1D9E75] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              placeholder="0.00"
                              onWheel={(e) => (e.target as HTMLElement).blur()}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Restante por pagar Garantía:</span>
                        <span className="text-xs font-black text-[#EF9F27]">S/ {Math.max(0, montoGarantiaInput - montoGarantiaPrimerPago).toFixed(2)}</span>
                      </div>
                    </div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 block mb-3">Subir Comprobante (Voucher)</label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => setComprobanteFile(e.target.files?.[0] || null)}
                      className="hidden"
                      accept="image/*,application/pdf"
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${comprobanteFile ? 'border-[#1D9E75] bg-[#1D9E75]/5' : 'border-gray-200 hover:border-[#1D9E75] hover:bg-gray-50'}`}
                    >
                      {comprobanteFile ? (
                        <>
                          <div className="w-12 h-12 bg-[#1D9E75] rounded-xl flex items-center justify-center text-white">
                            <Check size={24} />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-black text-gray-700">{comprobanteFile.name}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Click para cambiar archivo</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                            <Upload size={24} />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-black text-gray-700">Seleccionar Comprobante</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">JPG, PNG o PDF (Max 5MB)</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <div className="pt-8 mt-4 border-t border-gray-50 col-span-full">
          <h3 className="text-sm font-black text-[#1D9E75] uppercase tracking-[0.2em] mb-2">Contacto de Emergencia</h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">Persona a contactar en caso de urgencias.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Nombre Completo</label>
              <input
                name="emergenciaNombre"
                value={emergenciaNombre}
                onChange={(e) => setEmergenciaNombre(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                placeholder="Ej. María Pérez"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Teléfono</label>
              <input
                name="emergenciaTelefono"
                value={emergenciaTelefono}
                onChange={(e) => setEmergenciaTelefono(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                placeholder="Ej. 999 888 777"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Parentesco</label>
              <input
                name="emergenciaParentesco"
                value={emergenciaParentesco}
                onChange={(e) => setEmergenciaParentesco(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                placeholder="Ej. Madre, Padre, Hermano..."
              />
            </div>
          </div>
        </div>

        <div className="pt-8 mt-4 border-t border-gray-50 col-span-full">
          <h3 className="text-sm font-black text-[#EF9F27] uppercase tracking-[0.2em] mb-2">Salud y Nutrición</h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">Esta información es vital para el equipo de cocina.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Alergias</label>
              <input
                name="alergias"
                value={alergias}
                onChange={(e) => setAlergias(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                placeholder="Ej. Penicilina, Maní..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Restricciones Alimentarias</label>
              <input
                name="restriccionesAlimentarias"
                value={restricciones}
                onChange={(e) => setRestricciones(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                placeholder="Ej. Vegano, Sin lactosa, Diabético..."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 pt-10 border-t border-gray-50">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-8 py-4 rounded-2xl text-xs font-black text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all uppercase tracking-widest"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending || uploading}
          className="bg-[#1D9E75] hover:bg-[#167e5d] text-white rounded-2xl px-12 py-4 font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-[#1D9E75]/20 disabled:opacity-50 flex items-center gap-3"
        >
          {(isPending || uploading) ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          {initialData ? 'Actualizar Perfil' : 'Registrar Residente'}
        </button>
      </div>
    </form>
  )
}
