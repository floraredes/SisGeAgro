"use client"

import { useRouter, usePathname } from "next/navigation"
import { Timer, ArrowDownToLine, ArrowUpFromLine, Table2, Settings, LogOut } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabase/supabaseClient"
import { useToast } from "@/components/ui/simple-toast"

export function MainNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  const handleNavigation = (path: string) => {
    console.log(`Navigating to: ${path}`)
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
    <nav className="w-64 border-r bg-background px-4 py-6 flex flex-col h-screen">
      <div className="mb-8">
        <h1 className="text-xl font-bold">
          Sis<span className="text-[#4F7942]">Ge</span>Agro
        </h1>
      </div>
      <div className="flex flex-col flex-grow overflow-y-auto">
        <div className="space-y-2">
          <button
            onClick={() => handleNavigation("/dashboard")}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left ${
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
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left ${
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
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left ${
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

        <div className="mt-4">
          <h2 className="mb-2 px-4 text-xs font-semibold text-muted-foreground">PAGES</h2>
          <button
            onClick={() => handleNavigation("/dashboard/tabla")}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left ${
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

      <div className="mt-auto pt-4 space-y-2">
        <Separator className="my-4" />
        <button
          onClick={() => handleNavigation("/dashboard/settings")}
          className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left ${
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
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </nav>
  )
}
