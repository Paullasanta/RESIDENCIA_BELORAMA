import { create } from 'zustand'

interface ConfirmStore {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmText: string
  cancelText: string
  variant: 'danger' | 'warning' | 'info'
  confirm: (options: {
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    variant?: 'danger' | 'warning' | 'info'
  }) => Promise<boolean>
  close: () => void
}

export const useConfirmStore = create<ConfirmStore>((set) => ({
  isOpen: false,
  title: '',
  message: '',
  onConfirm: () => {},
  onCancel: () => {},
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  variant: 'info',
  confirm: (options) => {
    return new Promise((resolve) => {
      set({
        isOpen: true,
        title: options.title,
        message: options.message,
        confirmText: options.confirmText || 'Confirmar',
        cancelText: options.cancelText || 'Cancelar',
        variant: options.variant || 'info',
        onConfirm: () => {
          set({ isOpen: false })
          resolve(true)
        },
        onCancel: () => {
          set({ isOpen: false })
          resolve(false)
        },
      })
    })
  },
  close: () => set({ isOpen: false }),
}))
