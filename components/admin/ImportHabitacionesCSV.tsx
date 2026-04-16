'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { importHabitacionesCSV } from '@/app/actions/habitaciones'

export function ImportHabitacionesCSV({ residenciaId }: { residenciaId: number }) {
    const [loading, setLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setLoading(true)
        setError(null)

        try {
            const text = await file.text()
            const lines = text.split('\n')
            const header = lines[0].split(',').map(h => h.trim().toLowerCase())
            
            const rows = lines.slice(1).filter(line => line.trim()).map(line => {
                const values = line.split(',').map(v => v.trim())
                const obj: any = {}
                header.forEach((key, index) => {
                    obj[key] = values[index]
                })
                return obj
            })

            const res = await importHabitacionesCSV(residenciaId, rows)
            
            if (res.success) {
                setIsOpen(false)
                window.location.reload() // Recargar para ver los cambios
            } else {
                setError(res.error || 'Ocurrió un error al procesar el archivo.')
            }
        } catch (err) {
            setError('Error al leer el archivo CSV. Asegúrate de que tenga el formato correcto.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-gray-50 text-gray-500 hover:bg-gray-100 transition-all border border-gray-100"
            >
                <Upload size={18} />
                Importar CSV
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-black text-[#072E1F]">Importar Habitaciones</h2>
                                <p className="text-sm text-gray-400">Selecciona un archivo .csv con los datos.</p>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                                <X size={24} className="text-gray-400" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex flex-col gap-3">
                                <h4 className="text-sm font-black text-blue-900 uppercase tracking-widest">Formato Requerido</h4>
                                <code className="text-[10px] text-blue-700 bg-white/50 p-3 rounded-lg block overflow-x-auto">
                                    habitacion,disponibilidad,piso,capacidad<br/>
                                    101,libre,1,1<br/>
                                    102,ocupado,1,1
                                </code>
                                <p className="text-xs text-blue-600 font-medium">
                                    Estados: libre, ocupado, reservado, por liberarse.
                                </p>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-xl">
                                    {error}
                                </div>
                            )}

                            <div 
                                onClick={() => !loading && fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer ${loading ? 'opacity-50' : 'hover:border-[#1D9E75] hover:bg-green-50/50 border-gray-100'}`}
                            >
                                {loading ? (
                                    <Loader2 size={48} className="text-[#1D9E75] animate-spin" />
                                ) : (
                                    <Upload size={48} className="text-gray-300" />
                                )}
                                <div className="text-center">
                                    <p className="font-bold text-gray-700">{loading ? 'Procesando...' : 'Haz click para subir archivo'}</p>
                                    <p className="text-xs text-gray-400 mt-1">Solo archivos .csv</p>
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept=".csv"
                                    onChange={handleFileChange}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="p-8 bg-gray-50 flex justify-end">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:text-gray-600 transition-all uppercase tracking-widest text-xs"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
