"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import type { Tax } from "@/types/forms"

interface TaxSelectionProps {
  availableTaxes: Tax[]
  selectedTaxes: Tax[]
  transactionAmount: number
  movementType: "ingreso" | "egreso" | "inversión" // Add this prop
  onTaxSelect: (tax: Tax) => void
  onTaxRemove: (taxId: string) => void
  onAddNewTax: () => void
}

export function TaxSelection({
  availableTaxes,
  selectedTaxes,
  transactionAmount,
  movementType, // Add this prop
  onTaxSelect,
  onTaxRemove,
  onAddNewTax,
}: TaxSelectionProps) {
  const [searchQuery, setSearchQuery] = useState("")

  // Filtrar impuestos que tienen porcentaje y coinciden con la búsqueda
  const filteredTaxes = availableTaxes
    .filter((tax) => tax.percentage !== null) // Solo mostrar impuestos con porcentaje
    .filter((tax) => tax.name.toLowerCase().includes(searchQuery.toLowerCase()))

  // Update the tax calculation to consider movement type and handle null percentage
  const calculateTaxAmount = (percentage: number | null) => {
    if (percentage === null) return 0
    return (transactionAmount * percentage) / 100
  }

  // Calculate total tax amount
  const totalTaxAmount = selectedTaxes.reduce((sum, tax) => sum + calculateTaxAmount(tax.percentage), 0)

  // Calculate final amount based on movement type
  const finalAmount =
    movementType === "ingreso" ? transactionAmount - totalTaxAmount : transactionAmount + totalTaxAmount

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Impuestos Aplicables</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onAddNewTax()
          }}
          type="button"
        >
          Agregar nuevo impuesto
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar impuestos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
          type="text"
        />
      </div>

      <div className="rounded-md border">
        <ScrollArea className="h-[200px] p-4">
          <div className="grid grid-cols-1 gap-2">
            {filteredTaxes.length === 0 ? (
              <div className="text-center text-muted-foreground p-4">No hay impuestos con porcentaje disponibles</div>
            ) : (
              filteredTaxes.map((tax) => {
                const isSelected = selectedTaxes.some((t) => t.id === tax.id)
                const taxAmount = calculateTaxAmount(tax.percentage)

                return (
                  <div
                    key={tax.id}
                    className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                      isSelected ? "border-primary bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Button
                        variant={isSelected ? "secondary" : "ghost"}
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault()
                          isSelected ? onTaxRemove(tax.id) : onTaxSelect(tax)
                        }}
                        type="button"
                      >
                        {isSelected ? "Remover" : "Agregar"}
                      </Button>
                      <div>
                        <p className="font-medium">{tax.name}</p>
                        <p className="text-sm text-muted-foreground">{tax.percentage}%</p>
                      </div>
                    </div>
                    {transactionAmount > 0 && (
                      <Badge variant={isSelected ? "default" : "secondary"}>${taxAmount.toFixed(2)}</Badge>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {selectedTaxes.length > 0 && (
        <div className="rounded-lg bg-muted/50 p-4">
          <h4 className="mb-2 font-medium">Impuestos seleccionados</h4>
          <div className="space-y-2">
            {selectedTaxes.map((tax) => (
              <div key={tax.id} className="flex items-center justify-between text-sm">
                <span>
                  {tax.name} ({tax.percentage}%)
                </span>
                <span className="font-medium">${calculateTaxAmount(tax.percentage).toFixed(2)}</span>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t pt-2 text-sm font-medium">
              <span>Total impuestos:</span>
              <span>${totalTaxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-sm font-medium">
              <span>{movementType === "ingreso" ? "Total con impuestos descontados:" : "Total con impuestos:"}</span>
              <span>${finalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

