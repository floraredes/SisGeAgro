"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Timer, ArrowDownToLine, ArrowUpFromLine, Table2, Settings, LogOut, Menu } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabase/supabaseClient"
import { useToast } from "@/components/ui/simple-toast"

export function MainNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)

  const handleNavigation = (path: string) => {
    setOpen(false)
    router.push(path)
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      })
      router.push("/")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión",
        type: "error",
      })
    }
  }

  return (
    <>
      {/* Botón hamburguesa solo en mobile */}
      <button
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow md:hidden mr-2"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
      >
        <Menu className="h-6 w-6 text-[#4F7942]" />
      </button>

      {/* Overlay y nav en mobile */}
      <div
        className={`
          fixed inset-0 z-40 bg-black/40 transition-opacity duration-200
          ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
          md:hidden
        `}
        onClick={() => setOpen(false)}
      />

      <nav
        className={`
          fixed top-0 left-0 z-50 bg-background w-64 h-full shadow-lg
          transform transition-transform duration-200
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:static md:translate-x-0 md:w-64 md:h-screen md:flex
          flex-col
        `}
        style={{ minWidth: 0 }}
        aria-label="Main navigation"
      >
        <div className="mb-8 px-4 pt-6 flex-shrink-0 flex items-center justify-between">
          <h1 className="text-xl font-bold">
            Sis<span className="text-[#4F7942]">Ge</span>Agro
          </h1>
          {/* Botón cerrar solo en mobile */}
          <button
            className="md:hidden p-2 rounded-md"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
          >
            <svg className="h-6 w-6 text-[#4F7942]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex flex-col flex-grow overflow-visible">
          <div className="space-y-2 px-2">
            <button
              onClick={() => handleNavigation("/dashboard")}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left ${
                pathname === "/dashboard"
                  ? "bg-[#4F7942] text-white"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Timer className="h-5 w-5" />
              Dashboard
            </button>
            <button
              onClick={() => handleNavigation("/dashboard/ingresos")}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left ${
                pathname === "/dashboard/ingresos"
                  ? "bg-[#4F7942] text-white"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <ArrowDownToLine className="h-5 w-5" />
              Ingresos
            </button>
            <button
              onClick={() => handleNavigation("/dashboard/egresos")}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left ${
                pathname === "/dashboard/egresos"
                  ? "bg-[#4F7942] text-white"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <ArrowUpFromLine className="h-5 w-5" />
              Egresos
            </button>
            <Separator className="my-4" />
          </div>
          <div className="mt-4 px-2">
            <h2 className="mb-2 text-xs font-semibold text-muted-foreground">PAGES</h2>
            <button
              onClick={() => handleNavigation("/dashboard/tabla")}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left ${
                pathname === "/dashboard/tabla"
                  ? "bg-[#4F7942] text-white"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Table2 className="h-5 w-5" />
              Tabla
            </button>
          </div>
        </div>
        <div className="mt-auto pt-4 space-y-2 px-2">
          <Separator className="my-4" />
          <button
            onClick={() => handleNavigation("/dashboard/settings")}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left ${
              pathname === "/dashboard/settings"
                ? "bg-[#4F7942] text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Settings className="h-5 w-5" />
            Configuración
          </button>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </nav>
    </>
  )
}
