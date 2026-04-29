'use client'

import { useState, useEffect } from 'react'
import { Bell, Info, CreditCard, Megaphone, Wrench, Check } from 'lucide-react'
import { getNotifications, markAsRead } from '@/app/actions/notificaciones'
import Link from 'next/link'

export function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false)
    const [notificaciones, setNotificaciones] = useState<any[]>([])
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        fetchNotifications()
        // Polling más frecuente para mayor interactividad
        const interval = setInterval(fetchNotifications, 20000)
        return () => clearInterval(interval)
    }, [])

    const fetchNotifications = async () => {
        const data = await getNotifications()
        setNotificaciones(data)
        setUnreadCount(data.filter(n => !n.leida).length)
    }

    const handleMarkAsRead = async (id: number) => {
        await markAsRead(id)
        fetchNotifications()
    }

    const getIcon = (tipo: string) => {
        switch (tipo) {
            case 'PAGO': return <CreditCard className="text-orange-500" size={16} />
            case 'AVISO': return <Megaphone className="text-blue-500" size={16} />
            case 'TICKET': return <Wrench className="text-purple-500" size={16} />
            default: return <Info className="text-gray-500" size={16} />
        }
    }

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-3 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all text-gray-400 hover:text-[#1D9E75]"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-[2rem] shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-black text-[#072E1F] text-sm uppercase tracking-widest">Notificaciones</h3>
                            {unreadCount > 0 && <span className="text-[10px] font-bold text-gray-400">{unreadCount} nuevas</span>}
                        </div>
                        
                        <div className="max-h-[400px] overflow-y-auto">
                            {notificaciones.length === 0 ? (
                                <div className="p-10 text-center text-gray-400 italic text-xs">
                                    No tienes notificaciones.
                                </div>
                            ) : (
                                notificaciones.map((notif) => (
                                    <div 
                                        key={notif.id} 
                                        className={`p-4 border-b border-gray-50 flex gap-4 hover:bg-gray-50 transition-colors ${!notif.leida ? 'bg-blue-50/30' : ''}`}
                                    >
                                        <div className="mt-1">{getIcon(notif.tipo)}</div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <p className={`text-xs font-black leading-tight ${!notif.leida ? 'text-gray-900' : 'text-gray-500'}`}>
                                                    {notif.titulo}
                                                </p>
                                                {!notif.leida && (
                                                    <button 
                                                        onClick={() => handleMarkAsRead(notif.id)}
                                                        className="p-1 hover:bg-white rounded-md text-[#1D9E75] transition-colors"
                                                        title="Marcar como leída"
                                                    >
                                                        <Check size={12} />
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-gray-500 leading-normal">{notif.mensaje}</p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-[9px] font-bold text-gray-400">
                                                    {new Date(notif.createdAt).toLocaleTimeString()}
                                                </span>
                                                {notif.link && (
                                                    <Link 
                                                        href={notif.link} 
                                                        onClick={() => {
                                                            setIsOpen(false)
                                                            handleMarkAsRead(notif.id)
                                                        }}
                                                        className="text-[9px] font-black text-[#1D9E75] uppercase hover:underline"
                                                    >
                                                        Ver detalle
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        
                        <div className="p-4 bg-gray-50 text-center">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fin de las notificaciones</p>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
