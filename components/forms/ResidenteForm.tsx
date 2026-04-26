'use client'

import { useState, useTransition, useRef } from 'react'
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

  const [residenciaId, setResidenciaId] = useState(initialData?.user?.residenciaId || '')
  const [habitacionId, setHabitacionId] = useState(initialData?.habitacionId || '')

  // Estados para confirmación de pago
  const [pagoConfirmado, setPagoConfirmado] = useState(false)
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
                      defaultValue={initialData?.user?.dni}
                      required
                      className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                      placeholder="Ej. 74582104"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Nombres</label>
                  <input
                      name="nombre"
                      defaultValue={initialData?.user?.nombre}
                      required
                      className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                      placeholder="Ej. Juan"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Apellidos</label>
                  <input
                      name="apellidos"
                      defaultValue={initialData?.user?.apellidos}
                      required
                      className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                      placeholder="Ej. Pérez"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Teléfono</label>
                  <input
                      name="telefono"
                      defaultValue={initialData?.user?.telefono}
                      className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                      placeholder="Ej. 999 888 777"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                  <input
                      name="email"
                      type="email"
                      defaultValue={initialData?.user?.email}
                      required
                      className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                      placeholder="juan@email.com"
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

        <div className="pt-8 mt-4 border-t border-gray-50 col-span-full">
            <h3 className="text-sm font-black text-[#EF9F27] uppercase tracking-[0.2em] mb-2">Salud y Nutrición</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">Esta información es vital para el equipo de cocina.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Alergias</label>
                    <input
                        name="alergias"
                        defaultValue={initialData?.alergias}
                        className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#EF9F27] focus:ring-4 focus:ring-[#EF9F27]/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                        placeholder="Ej. Maní, Lactosa, Mariscos..."
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Restricciones Alimentarias</label>
                    <input
                        name="restriccionesAlimentarias"
                        defaultValue={initialData?.restriccionesAlimentarias}
                        className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#EF9F27] focus:ring-4 focus:ring-[#EF9F27]/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                        placeholder="Ej. Vegano, Sin Sal, Diabético..."
                    />
                </div>
            </div>
        </div>

        {!initialData && (
          <>
            <div className="pt-8 mt-4 border-t border-gray-50 col-span-full">
              <h3 className="text-sm font-black text-[#EF9F27] uppercase tracking-[0.2em] mb-2">Configuración Financiera Inicial</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">
                Se generarán los registros de deuda correspondientes. <br />
                <span className="text-[#1D9E75]">Aviso: La contraseña inicial será el DNI del residente.</span>
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
                  defaultValue="0"
                  className="w-full pl-10 pr-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-black text-gray-700"
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
                  defaultValue="0"
                  className="w-full pl-10 pr-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-black text-gray-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Dividir Garantía en</label>
              <select
                name="cuotasGarantia"
                className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/5 outline-none transition-all font-black text-gray-700 appearance-none cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? 'parte' : 'partes'}</option>
                ))}
              </select>
            </div>

            {/* Nueva Sección: Confirmación de Pago */}
            <div className="col-span-full pt-8 mt-4 border-t border-gray-50">
              <div className="bg-[#1D9E75]/5 p-8 rounded-3xl border border-[#1D9E75]/10 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-[#1D9E75] uppercase tracking-widest mb-1">Confirmación de Pago Entrada</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">¿Deseas confirmar el pago de Renta + Garantía ahora mismo?</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPagoConfirmado(!pagoConfirmado)}
                    className={`w-14 h-8 rounded-full transition-all relative ${pagoConfirmado ? 'bg-[#1D9E75]' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${pagoConfirmado ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                {pagoConfirmado && (
                   <div className="pt-4 animate-in slide-in-from-top-4 duration-300">
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
          {initialData ? 'Actualizar Perfil' : 'Dar de Alta Residente'}
        </button>
      </div>
    </form>
  )
}
