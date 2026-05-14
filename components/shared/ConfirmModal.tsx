'use client'

import { useConfirmStore } from '@/store/useConfirmStore'
import { AlertCircle, X, CheckCircle2, AlertTriangle } from 'lucide-react'

export function ConfirmModal() {
  const { isOpen, title, message, onConfirm, onCancel, confirmText, cancelText, variant, close } = useConfirmStore()

  if (!isOpen) return null

  const getIcon = () => {
    switch (variant) {
      case 'danger': return <AlertTriangle size={32} className="text-red-500" />
      case 'warning': return <AlertCircle size={32} className="text-orange-500" />
      default: return <CheckCircle2 size={32} className="text-[#1D9E75]" />
    }
  }

  const getButtonClass = () => {
    switch (variant) {
      case 'danger': return 'bg-red-600 hover:bg-red-700 shadow-red-200'
      case 'warning': return 'bg-orange-500 hover:bg-orange-600 shadow-orange-200'
      default: return 'bg-[#1D9E75] hover:bg-[#167e5d] shadow-[#1D9E75]/20'
    }
  }

  const getBgClass = () => {
    switch (variant) {
      case 'danger': return 'bg-red-50'
      case 'warning': return 'bg-orange-50'
      default: return 'bg-green-50'
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#072E1F]/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <div className="flex justify-end mb-2">
            <button 
              onClick={onCancel}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-col items-center text-center space-y-4">
            <div className={`w-20 h-20 ${getBgClass()} rounded-[2rem] flex items-center justify-center mb-2`}>
              {getIcon()}
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-black text-[#072E1F] tracking-tight">{title}</h3>
              <p className="text-sm text-gray-500 font-bold leading-relaxed px-4">
                {message}
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-10">
            <button
              onClick={onCancel}
              className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 border border-gray-100 hover:bg-gray-50 transition-all"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 ${getButtonClass()}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
