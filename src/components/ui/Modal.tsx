import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={[
              'relative z-10 w-full bg-bg-card border border-border shadow-xl',
              'rounded-t-2xl md:rounded-2xl',
              'max-h-[90vh] md:max-h-[85vh] overflow-y-auto scrollbar-thin',
              sizeClasses[size],
            ].join(' ')}
          >
            {title && (
              <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-bg-card z-10">
                <h2 className="text-base font-semibold text-text-primary">{title}</h2>
                <button
                  onClick={onClose}
                  aria-label="Tutup modal"
                  className="p-1.5 rounded-lg hover:bg-bg-secondary text-text-muted hover:text-text-primary transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
