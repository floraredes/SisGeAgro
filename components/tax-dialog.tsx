"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/simple-toast"
import { supabase } from "@/lib/supabase/supabaseClient"
import type { TaxFormData } from "@/types/forms"
import { Checkbox } from "@/components/ui/checkbox"

interface TaxDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaxCreated: (taxName: string, percentage: number | null) => void
}

export function TaxDialog({ open, onOpenChange, onTaxCreated }: TaxDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<TaxFormData>({
    name: "",
    percentage: 0,
    hasPercentage: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (!formData.name.trim()) throw new Error("El nombre del impuesto es obligatorio")
      if (formData.hasPercentage) {
        if (formData.percentage <= 0 || formData.percentage > 100) {
          throw new Error("El porcentaje debe ser mayor que 0 y menor o igual a 100")
        }
      }

      await onTaxCreated(
        formData.name,
        formData.hasPercentage ? formData.percentage : null
      )

    setFormData({ name: "", percentage: 0, hasPercentage: true })
    } catch (error: any) {
      console.error("Error al crear impuesto:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el impuesto",
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
          <DialogTitle>Crear nuevo impuesto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="taxName">Nombre del impuesto</Label>
            <Input
              id="taxName"
              value={formData.name}
              onChange={(e) => setFormData((prev: TaxFormData) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasPercentage"
              checked={formData.hasPercentage}
              onCheckedChange={(checked) => setFormData((prev: TaxFormData) => ({ ...prev, hasPercentage: !!checked }))}
            />
            <Label htmlFor="hasPercentage">Este impuesto tiene un porcentaje asociado</Label>
          </div>

          {formData.hasPercentage && (
            <div className="space-y-2">
              <Label htmlFor="percentage">Porcentaje</Label>
              <Input
                id="percentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.percentage}
                onChange={(e) =>
                  setFormData((prev: TaxFormData) => ({ ...prev, percentage: Number.parseFloat(e.target.value) }))
                }
                required={formData.hasPercentage}
              />
            </div>
          )}

          <Button type="submit" className="w-full bg-[#4F7942] hover:bg-[#3F6932]" disabled={loading}>
            {loading ? "Enviando..." : "Crear impuesto"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

