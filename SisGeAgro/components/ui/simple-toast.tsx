"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type ToastType = "success" | "error" | "info"

// Mapeo de variantes a tipos
const variantToType = {
  default: "info",
  destructive: "error",
} as const

interface Toast {
  id: string
  title?: string
  description: string
  type: ToastType
}

// Actualizamos la interfaz para aceptar variant o type
interface ToastProps {
  title?: string
  description: string
  type?: ToastType
  variant?: "default" | "destructive"
}

interface ToastContextType {
  toast: (props: ToastProps) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = ({ title, description, type = "info", variant }: ToastProps) => {
    // Si se proporciona variant, lo convertimos a type
    const toastType = variant ? variantToType[variant] : type

    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, title, description, type: toastType }])

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 5000)
  }

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 rounded-lg shadow-md max-w-md animate-fade-in ${
              toast.type === "error"
                ? "bg-red-100 border border-red-300 text-red-800"
                : toast.type === "success"
                  ? "bg-green-100 border border-green-300 text-green-800"
                  : "bg-blue-100 border border-blue-300 text-blue-800"
            }`}
            style={{
              animation: "fadeIn 0.3s ease-out",
            }}
          >
            {toast.title && <h3 className="font-medium text-sm">{toast.title}</h3>}
            <p className="text-sm">{toast.description}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

export function ToastListener() {
  const { toast } = useToast()

  useEffect(() => {
    const handleToast = (e: any) => {
      toast(e.detail)
    }

    window.addEventListener("toast", handleToast)
    return () => window.removeEventListener("toast", handleToast)
  }, [toast])

  return null
}

