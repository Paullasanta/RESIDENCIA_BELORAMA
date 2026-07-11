'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createResidente, updateResidente, reactivateResidente } from '@/app/actions/residentes'
import { Button } from '@/components/ui/button'
import { Loader2, Save, X, Upload, Check, Eye, EyeOff } from 'lucide-react'
import { capitalizeName } from '@/lib/utils'

interface ResidenteFormProps {
  residencias: any[]
  initialData?: any
}

export function ResidenteForm({ residencias, initialData }: ResidenteFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

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
  const [diaPago, setDiaPago] = useState<string | number>(
    initialData?.diaPago || (initialData?.fechaIngreso ? new Date(initialData.fechaIngreso).getDate() : '')
  )
  const [duracion, setDuracion] = useState('')

  // Estados de Información Personal
  const [dni, setDni] = useState(initialData?.user?.dni || '')
  const [nombre, setNombre] = useState(initialData?.user?.nombre || '')
  const [apellidoPaterno, setApellidoPaterno] = useState(initialData?.user?.apellidoPaterno || '')
  const [apellidoMaterno, setApellidoMaterno] = useState(initialData?.user?.apellidoMaterno || '')
  const [telefono, setTelefono] = useState(initialData?.user?.telefono || '+51 ')
  const [email, setEmail] = useState(initialData?.user?.email || '')

  // Estados de Emergencia
  const [emergenciaNombre, setEmergenciaNombre] = useState(initialData?.user?.emergenciaNombre || '')
  const [emergenciaTelefono, setEmergenciaTelefono] = useState(initialData?.user?.emergenciaTelefono || '+51 ')
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

  const [montoMensualInput, setMontoMensualInput] = useState<string | number>(initialData?.montoMensual ?? '')
  const [montoGarantiaInput, setMontoGarantiaInput] = useState<string | number>(initialData?.montoGarantia ?? '')
  const [cuotasGarantiaInput, setCuotasGarantiaInput] = useState(
    initialData?.pagos?.filter((p: any) => 
      p.concepto.includes('Garantía') && 
      p.estado !== 'RECHAZADO' &&
      (initialData.fechaIngreso ? new Date(p.fechaVencimiento) >= new Date(initialData.fechaIngreso) : true)
    ).length || 1
  )
  const [garantiaNoReembolsableInput, setGarantiaNoReembolsableInput] = useState<string | number>(initialData?.garantiaNoReembolsable ?? '')
  const [comentariosInput, setComentariosInput] = useState(initialData?.comentarios || '')

  // Filtrar habitaciones disponibles de la residencia seleccionada
  const residenciaSeleccionada = residencias.find(r => r.id.toString() === residenciaId.toString())
  const habitacionesDisponibles = residenciaSeleccionada?.habitaciones || []

  async function handleSubmit(formData: FormData) {
    setError(null)

    try {
      const data = Object.fromEntries(formData.entries())

      // Validación de campos obligatorios financieros
      if (montoMensualInput === '' || montoGarantiaInput === '' || garantiaNoReembolsableInput === '' || diaPago === '' || diaPago === 0) {
        throw new Error('Todos los campos financieros (Monto Mensual, Garantía, Garantía No Reembolsable) y el Día de Pago son obligatorios.')
      }

      // Asegurar que todos los campos financieros del estado se incluyan explícitamente
      const finalData = {
        ...data,
        montoMensual: montoMensualInput,
        montoGarantia: montoGarantiaInput,
        garantiaNoReembolsable: garantiaNoReembolsableInput,
        comentarios: comentariosInput,
        cuotasGarantia: cuotasGarantiaInput,
      }

      startTransition(async () => {
        let result;
        
        if (initialData?.isReintegro) {
          // Si es un reingreso, usamos la acción de reactivación con el modo 'reentry'
          result = await reactivateResidente(initialData.oldResidenteId, 'reentry', finalData)
        } else if (initialData?.id) {
          // Si tiene ID y no es reingreso, es una actualización normal
          result = await updateResidente(initialData.id, finalData)
        } else {
          // Si no tiene nada, es una creación nueva
          result = await createResidente(finalData)
        }

        if (result.success) {
          router.push('/modules/residentes')
          router.refresh()
        } else {
          setError(result.error)
        }
      })
    } catch (err: any) {
      setError(err.message || 'Error al procesar el formulario')
    }
  }

  return (
    <form action={handleSubmit} className="space-y-8 bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/50">
      {error && (
        <div className="p-6 bg-red-50/50 backdrop-blur-sm border-l-4 border-red-500 text-red-700 rounded-2xl text-sm font-bold flex items-center gap-4 animate-in slide-in-from-top-2 duration-500 shadow-sm shadow-red-100">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
             <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-red-400 font-black mb-0.5">Error de Validación</span>
            {error}
          </div>
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
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                  if (val.length <= 15) setDni(val);
                }}
                required
                maxLength={15}
                className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                placeholder="DNI, Pasaporte, C.E."
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Nombres</label>
              <input
                name="nombre"
                value={nombre}
                onChange={(e) => setNombre(capitalizeName(e.target.value))}
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
                onChange={(e) => setApellidoPaterno(capitalizeName(e.target.value))}
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
                onChange={(e) => setApellidoMaterno(capitalizeName(e.target.value))}
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
                onChange={(e) => {
                  let val = e.target.value;
                  // Si el usuario intenta borrar el prefijo, lo mantenemos
                  if (!val.startsWith('+51 ')) {
                    val = '+51 ' + val.replace(/^\+51\s?/, '');
                  }
                  // Evitar duplicados de +51
                  const clean = val.replace(/^\+51\s?/, '');
                  const numbersOnly = clean.replace(/[^0-9]/g, '');
                  if (numbersOnly.length <= 9) {
                    setTelefono('+51 ' + numbersOnly);
                  }
                }}
                inputMode="numeric"
                className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                placeholder="+51 999888777"
              />
              <p className="text-[9px] text-gray-400 font-bold uppercase mt-1 ml-1 tracking-tighter">* Máximo 9 números</p>
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
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-[#1D9E75] transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
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
                setDiaPago('')
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
              type="text"

              required
              value={montoMensualInput}
              onChange={(e) => {
                let val = e.target.value.replace(/[^0-9.]/g, '');
                const parts = val.split('.');
                if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
                setMontoMensualInput(val === '' ? '' : Number(val));
              }}
              className="w-full pl-10 pr-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-black text-gray-700"
              inputMode="decimal"
              placeholder="0.00"

            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Garantía (Total)</label>
          <div className="relative group/input">
            <span className="absolute left-5 inset-y-0 flex items-center text-gray-300 font-black group-focus-within/input:text-[#1D9E75] transition-colors">$</span>
            <input
              name="montoGarantia"
              type="text"

              required
              value={montoGarantiaInput}
              onChange={(e) => {
                let val = e.target.value.replace(/[^0-9.]/g, '');
                const parts = val.split('.');
                if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
                setMontoGarantiaInput(val === '' ? '' : Number(val));
              }}
              className="w-full pl-10 pr-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-black text-gray-700"
              inputMode="decimal"
              placeholder="0.00"

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

        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Garantía No Reembolsable</label>
          <div className="relative group/input">
            <span className="absolute left-5 inset-y-0 flex items-center text-gray-300 font-black group-focus-within/input:text-[#1D9E75] transition-colors">$</span>
            <input
              name="garantiaNoReembolsable"
              type="text"
              required
              value={garantiaNoReembolsableInput}
              onChange={(e) => {
                let val = e.target.value.replace(/[^0-9.]/g, '');
                const parts = val.split('.');
                if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
                setGarantiaNoReembolsableInput(val === '' ? '' : Number(val));
              }}
              className="w-full pl-10 pr-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-black text-gray-700"
              inputMode="decimal"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="space-y-2 col-span-full">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Comentarios / Notas Adicionales</label>
          <textarea
            name="comentarios"
            value={comentariosInput}
            onChange={(e) => setComentariosInput(e.target.value)}
            rows={3}
            className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-medium text-gray-700 placeholder:text-gray-300 resize-none"
            placeholder="Escribe aquí cualquier observación relevante..."
          />
        </div>

        <div className="col-span-full mt-4">
          <div className="p-8 rounded-[2rem] bg-gradient-to-br from-red-50/30 to-orange-50/20 border border-red-100/50 relative overflow-hidden group hover:border-red-200/50 transition-all">
            {/* Decoración de fondo */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-500/5 rounded-full blur-3xl group-hover:bg-red-500/10 transition-all" />
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20 text-white">
                <X size={24} className="rotate-45" />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-800 uppercase tracking-widest">Contacto de Emergencia</h3>
                <p className="text-[10px] text-red-500/60 font-black uppercase tracking-widest">Protocolo de Seguridad y Urgencias</p>
              </div>
            </div>
  
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                <input
                  name="emergenciaNombre"
                  value={emergenciaNombre}
                  onChange={(e) => setEmergenciaNombre(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-white/50 focus:bg-white focus:border-red-400 focus:ring-4 focus:ring-red-400/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300 shadow-sm"
                  placeholder="Ej. María Pérez"
                />
              </div>
  
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Teléfono Emergencia</label>
                <input
                  name="emergenciaTelefono"
                  value={emergenciaTelefono}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (!val.startsWith('+51 ')) {
                      val = '+51 ' + val.replace(/^\+51\s?/, '');
                    }
                    const clean = val.replace(/^\+51\s?/, '');
                    const numbersOnly = clean.replace(/[^0-9]/g, '');
                    if (numbersOnly.length <= 9) {
                      setEmergenciaTelefono('+51 ' + numbersOnly);
                    }
                  }}
                  inputMode="numeric"
                  className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-white/50 focus:bg-white focus:border-red-400 focus:ring-4 focus:ring-red-400/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300 shadow-sm"
                  placeholder="+51 999888777"
                />
              </div>
  
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Parentesco</label>
                <input
                  name="emergenciaParentesco"
                  value={emergenciaParentesco}
                  onChange={(e) => setEmergenciaParentesco(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-white/50 focus:bg-white focus:border-red-400 focus:ring-4 focus:ring-red-400/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300 shadow-sm"
                  placeholder="Ej. Madre, Padre, Hermano..."
                />
              </div>
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

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="px-8 py-6 rounded-2xl border-gray-100 font-bold text-gray-400 hover:text-gray-600 transition-all"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className={`px-10 py-6 rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all flex items-center gap-2 ${
              initialData?.isReintegro ? 'bg-[#EF9F27] hover:bg-[#d88d1d] shadow-[#EF9F27]/20' : 
              'bg-[#1D9E75] hover:bg-[#167e5d] shadow-[#1D9E75]/20'
            }`}
          >
            {isPending ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Save size={20} />
            )}
            {initialData?.isReintegro ? 'Procesar Reintegración' : (initialData?.id ? 'Guardar Cambios' : 'Registrar Residente')}
          </Button>
        </div>
    </form>
  )
}
