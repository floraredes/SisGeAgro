"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/simple-toast"
import { supabase } from "@/lib/supabase/supabaseClient"

interface Entity {
  id: string
  nombre: string
  cuit_cuil: string
}

interface EntityFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEntityCreated: (entity: Entity) => void
}

export function EntityForm({ open, onOpenChange, onEntityCreated }: EntityFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [entityName, setEntityName] = useState("")
  const [entityCuitCuil, setEntityCuitCuil] = useState("")
  const [cuitCuilError, setCuitCuilError] = useState<string | null>(null)

  const validateCuitCuil = (cuitCuil: string): boolean => {
    // Remove any non-digit characters
    const cleanCuitCuil = cuitCuil.replace(/\D/g, "")

    // Check if it has exactly 11 digits
    if (cleanCuitCuil.length !== 11) {
      setCuitCuilError("El CUIT/CUIL debe tener exactamente 11 dígitos")
      return false
    }

    setCuitCuilError(null)
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validar campos
      if (!entityName.trim()) {
        throw new Error("El nombre de la entidad es obligatorio")
      }

      if (!validateCuitCuil(entityCuitCuil)) {
        setLoading(false)
        return
      }

      // Verificar si ya existe una entidad con ese CUIT/CUIL
      const { data: existingEntity, error: checkError } = await supabase
        .from("entity")
        .select("*")
        .eq("cuit_cuil", entityCuitCuil)
        .maybeSingle()

      if (checkError) throw checkError

      if (existingEntity) {
        // En lugar de mostrar un error, informamos al usuario que la entidad ya existe
        // y la seleccionamos automáticamente
        toast({
          title: "Entidad existente",
          description: "Ya existe una entidad con ese CUIT/CUIL. Se ha seleccionado automáticamente.",
          type: "info",
        })

        // Notificar al componente padre con la entidad existente
        onEntityCreated(existingEntity)
        return
      }

      // Crear la entidad
      const { data, error } = await supabase
        .from("entity")
        .insert([
          {
            nombre: entityName,
            cuit_cuil: entityCuitCuil,
          },
        ])
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Entidad creada",
        description: "La entidad ha sido creada correctamente",
        type: "success",
      })

      // Notificar al componente padre
      onEntityCreated(data)

      // Limpiar el formulario
      setEntityName("")
      setEntityCuitCuil("")
    } catch (error: any) {
      console.error("Error creating entity:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la entidad",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear nueva entidad</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="entityName">Nombre de la entidad</Label>
            <Input id="entityName" value={entityName} onChange={(e) => setEntityName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="entityCuitCuil">CUIT/CUIL</Label>
            <Input
              id="entityCuitCuil"
              value={entityCuitCuil}
              onChange={(e) => {
                const newValue = e.target.value
                setEntityCuitCuil(newValue)
                validateCuitCuil(newValue)
              }}
              className={cuitCuilError ? "border-red-500" : ""}
              required
            />
            {cuitCuilError && <p className="text-sm text-red-500 mt-1">{cuitCuilError}</p>}
          </div>

          <Button type="submit" className="w-full bg-[#4F7942] hover:bg-[#3F6932]" disabled={loading}>
            {loading ? "Creando..." : "Crear entidad"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

