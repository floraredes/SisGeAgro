"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/simple-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { TaxDialog } from "./tax-dialog"
import { supabase } from "@/lib/supabase/supabaseClient"
import type { MovementFormData, Tax } from "@/types/forms"
import { TaxSelection } from "./tax-selection"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EntitySelector } from "./entity-selector"
import { EntityForm } from "./entity-form"

const PAYMENT_TYPES = ["Efectivo", "Débito", "Crédito", "Transferencia", "Otro"]
const MOVEMENT_TYPES = ["ingreso", "egreso", "inversión"]

interface MovementFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultMovementType?: "ingreso" | "egreso" | "inversión"
  isEditMode?: boolean
  existingData?: any // Datos del movimiento existente para editar
  onSuccess?: () => void // Callback para cuando se completa la operación
}

export function MovementForm({
  open,
  onOpenChange,
  defaultMovementType,
  isEditMode = false,
  existingData = null,
  onSuccess,
}: MovementFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [taxDialogOpen, setTaxDialogOpen] = useState(false)
  const [availableTaxes, setAvailableTaxes] = useState<Tax[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [entitySelectorOpen, setEntitySelectorOpen] = useState(false)
  const [entityFormOpen, setEntityFormOpen] = useState(false)
  const [formData, setFormData] = useState<MovementFormData>({
    description: "",
    movementType: defaultMovementType || "ingreso",
    paymentType: "",
    customPaymentType: "",
    amount: 0,
    category: "",
    subCategory: "",
    billNumber: "",
    billDate: "",
    entityName: "",
    entityId: "",
    selectedTaxes: [],
    isTaxPayment: false,
    relatedTaxId: null,
    check: false,
  })
  const [billNumberError, setBillNumberError] = useState<string | null>(null)
  const [cuitCuilError, setCuitCuilError] = useState<string | null>(null)

  // Determinar si el número de factura es obligatorio
  const isBillNumberRequired = formData.movementType !== "ingreso"

  useEffect(() => {
    if (open) {
      fetchTaxes()
      getCurrentUser()
    }
  }, [open])

  // Cargar datos existentes si estamos en modo edición
  useEffect(() => {
    if (isEditMode && existingData && open) {
      // Formatear la fecha para el input date
      let formattedDate = existingData.fechaComprobante || ""
      if (formattedDate) {
        try {
          const date = new Date(formattedDate)
          formattedDate = date.toISOString().split("T")[0]
        } catch (error) {
          console.error("Error formatting date:", error)
        }
      }

      setFormData({
        description: existingData.detalle || "",
        movementType: existingData.movimiento || defaultMovementType || "ingreso",
        paymentType: existingData.formaPago || "",
        customPaymentType:
          existingData.formaPago && !PAYMENT_TYPES.includes(existingData.formaPago) ? existingData.formaPago : "",
        amount: existingData.importe || 0,
        category: existingData.rubro || "",
        subCategory: existingData.subrubro || "",
        billNumber: existingData.factura || "",
        billDate: formattedDate,
        entityName: existingData.empresa || "",
        entityId: existingData.entityId || "",
        selectedTaxes: existingData.taxes || [],
        isTaxPayment: existingData.isTaxPayment || false,
        relatedTaxId: existingData.relatedTaxId || null,
        check: existingData.check || false,
      })
    }
  }, [isEditMode, existingData, open, defaultMovementType])

  // Limpiar el error del número de factura cuando cambia
  useEffect(() => {
    if (billNumberError) {
      setBillNumberError(null)
    }
  }, [formData.billNumber])

  // Cuando se marca como pago de impuesto, establecer automáticamente la categoría
  useEffect(() => {
    if (formData.isTaxPayment) {
      setFormData((prev) => ({
        ...prev,
        category: "Impuestos y Tasas",
        subCategory: prev.relatedTaxId
          ? availableTaxes.find((tax) => tax.id === prev.relatedTaxId)?.name || "Pago de Impuesto"
          : "Pago de Impuesto",
        movementType: "egreso", // Forzar el tipo de movimiento a "egreso" cuando es un pago de impuesto
      }))
    }
  }, [formData.isTaxPayment, formData.relatedTaxId, availableTaxes])

  const getCurrentUser = async () => {
    try {
      const { data, error } = await supabase.auth.getUser()
      if (error) throw error
      setCurrentUser(data.user)
      console.log("Current user:", data.user) // Para depuración
    } catch (error) {
      console.error("Error getting current user:", error)
    }
  }

  const fetchTaxes = async () => {
    try {
      const { data, error } = await supabase.from("taxes").select("*")
      if (error) throw error
      setAvailableTaxes(data || [])
    } catch (error) {
      console.error("Error fetching taxes:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      description: "",
      movementType: "ingreso",
      paymentType: "",
      customPaymentType: "",
      amount: 0,
      category: "",
      subCategory: "",
      billNumber: "",
      billDate: "",
      entityName: "",
      entityId: "",
      selectedTaxes: [],
      isTaxPayment: false,
      relatedTaxId: null,
      check: false,
    })
    setBillNumberError(null)
    setCuitCuilError(null)
  }

  // Verificar si el número de factura ya existe
  const checkBillNumberExists = async (billNumber: string): Promise<boolean> => {
    if (!billNumber.trim()) return false

    const { data, error } = await supabase.from("bills").select("bill_number").eq("bill_number", billNumber).limit(1)

    if (error) {
      console.error("Error checking bill number:", error)
      return false
    }

    return data && data.length > 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setBillNumberError(null)

    try {
      // Verificar que el usuario esté autenticado
      if (!currentUser || !currentUser.id) {
        throw new Error("Debe iniciar sesión para realizar esta acción")
      }

      // Verificar si el usuario tiene un perfil y crearlo si no existe
      try {
        const { data: existingProfiles, error: profileCheckError } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", currentUser.id)

        if (profileCheckError) {
          console.error("Error al verificar el perfil:", profileCheckError)
          throw new Error("Error al verificar el perfil del usuario")
        }

        // Si no existe un perfil, crearlo
        if (!existingProfiles || existingProfiles.length === 0) {
          // Generar un nombre de usuario basado en el email o usar un valor predeterminado
          let username = "Usuario"
          if (currentUser.email) {
            // Extraer la parte antes del @ del email
            username = currentUser.email.split("@")[0]
          } else if (currentUser.user_metadata?.username) {
            // Usar el nombre de usuario de los metadatos si existe
            username = currentUser.user_metadata.username
          }

          const { error: profileCreateError } = await supabase.from("profiles").insert([
            {
              id: currentUser.id,
              email: currentUser.email || "",
              username: username, // Agregar el nombre de usuario
              created_at: new Date().toISOString(),
            },
          ])

          if (profileCreateError) {
            console.error("Error al crear el perfil del usuario:", profileCreateError)
            throw new Error("No se pudo crear el perfil del usuario")
          }
        }
      } catch (error) {
        console.error("Error en la gestión del perfil:", error)
        throw new Error("Error al gestionar el perfil del usuario")
      }

      // Validar que se haya seleccionado un tipo de movimiento
      if (!formData.movementType) {
        throw new Error("Debe seleccionar un tipo de movimiento")
      }

      // Validar que se haya seleccionado una forma de pago
      if (!formData.paymentType) {
        throw new Error("Debe seleccionar una forma de pago")
      }

      // Validar que se haya ingresado un método de pago personalizado si se seleccionó "Otro"
      if (formData.paymentType === "Otro" && !formData.customPaymentType.trim()) {
        throw new Error("Debe especificar el método de pago personalizado")
      }

      // Si es un pago de impuesto, validar que se haya seleccionado un impuesto relacionado
      if (formData.isTaxPayment && !formData.relatedTaxId) {
        toast({
          title: "Error de validación",
          description: "Debe seleccionar el tipo de impuesto que está pagando",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Verificar si el número de factura ya existe (solo si se proporcionó uno y no estamos en modo edición o el número cambió)
      if (
        formData.billNumber.trim() &&
        (!isEditMode || (isEditMode && existingData && formData.billNumber !== existingData.factura))
      ) {
        const billNumberExists = await checkBillNumberExists(formData.billNumber)
        if (billNumberExists) {
          setBillNumberError("Este número de factura ya existe. Por favor, ingrese uno diferente.")
          toast({
            title: "Error de validación",
            description: "Este número de factura ya existe. Por favor, ingrese uno diferente.",
            variant: "destructive",
          })
          setLoading(false)
          return // Retornar aquí en lugar de lanzar un error
        }
      } else if (isBillNumberRequired && !formData.billNumber.trim()) {
        // Si el número de factura es obligatorio (no es ingreso) y no se proporcionó
        setBillNumberError("El número de factura es obligatorio para este tipo de movimiento.")
        toast({
          title: "Error de validación",
          description: "El número de factura es obligatorio para este tipo de movimiento.",
          variant: "destructive",
        })
        setLoading(false)
        return // Retornar aquí en lugar de lanzar un error
      }

      if (isEditMode && existingData && existingData.id) {
        // Lógica para actualizar un movimiento existente
        // Aquí implementaremos la actualización del movimiento

        // Actualizar la entidad
        const { data: entityData, error: entityError } = await supabase
          .from("entity")
          .upsert(
            {
              nombre: formData.entityName,
              cuit_cuil: formData.entityId,
            },
            { onConflict: "cuit_cuil" },
          )
          .select()
          .single()

        if (entityError) throw entityError

        // Obtener el ID de la operación asociada al movimiento
        const { data: movementData, error: movementFetchError } = await supabase
          .from("movements")
          .select("operation_id")
          .eq("id", existingData.id)
          .single()

        if (movementFetchError) throw movementFetchError

        // Obtener los datos de la operación
        const { data: operationData, error: operationFetchError } = await supabase
          .from("operations")
          .select("payment_id, bill_id")
          .eq("id", movementData.operation_id)
          .single()

        if (operationFetchError) throw operationFetchError

        // Actualizar el método de pago
        const { error: paymentUpdateError } = await supabase
          .from("payment")
          .update({
            payment_type: formData.paymentType === "Otro" ? formData.customPaymentType : formData.paymentType,
          })
          .eq("id", operationData.payment_id)

        if (paymentUpdateError) throw paymentUpdateError

        // Actualizar la factura
        const { error: billUpdateError } = await supabase
          .from("bills")
          .update({
            bill_number: formData.billNumber,
            bill_date: formData.billDate,
            bill_amount: formData.amount,
            entity_id: entityData.id,
          })
          .eq("id", operationData.bill_id)

        if (billUpdateError) throw billUpdateError

        // Actualizar categoría y subcategoría
        // Primero verificar si la categoría existe
        let categoryData
        const { data: existingCategories, error: categoryFetchError } = await supabase
          .from("category")
          .select("*")
          .eq("description", formData.category)
          .limit(1)

        if (categoryFetchError) throw categoryFetchError

        if (existingCategories && existingCategories.length > 0) {
          categoryData = existingCategories[0]
        } else {
          const { data: newCategory, error: categoryInsertError } = await supabase
            .from("category")
            .insert([{ description: formData.category }])
            .select()
            .single()

          if (categoryInsertError) throw categoryInsertError
          categoryData = newCategory
        }

        // Verificar si la subcategoría existe
        let subcategoryData
        const { data: existingSubcategories, error: subcategoryFetchError } = await supabase
          .from("sub_category")
          .select("*")
          .eq("description", formData.subCategory)
          .eq("category_id", categoryData.id)
          .limit(1)

        if (subcategoryFetchError) throw subcategoryFetchError

        if (existingSubcategories && existingSubcategories.length > 0) {
          subcategoryData = existingSubcategories[0]
        } else {
          const { data: newSubcategory, error: subcategoryInsertError } = await supabase
            .from("sub_category")
            .insert([
              {
                description: formData.subCategory,
                category_id: categoryData.id,
              },
            ])
            .select()
            .single()

          if (subcategoryInsertError) throw subcategoryInsertError
          subcategoryData = newSubcategory
        }

        // Actualizar el movimiento con los nuevos campos de pago de impuestos
        const { error: movementUpdateError } = await supabase
          .from("movements")
          .update({
            description: formData.description,
            movement_type: formData.movementType,
            sub_category_id: subcategoryData.id,
            is_tax_payment: formData.isTaxPayment,
            related_tax_id: formData.isTaxPayment ? formData.relatedTaxId : null,
            check: formData.check,
          })
          .eq("id", existingData.id)

        if (movementUpdateError) throw movementUpdateError

        // Eliminar los impuestos existentes y agregar los nuevos
        const { error: taxDeleteError } = await supabase
          .from("movement_taxes")
          .delete()
          .eq("movement_id", existingData.id)

        if (taxDeleteError) throw taxDeleteError

        // Agregar los nuevos impuestos
        if (formData.selectedTaxes.length > 0) {
          const movementTaxesData = formData.selectedTaxes.map((tax: Tax) => ({
            movement_id: existingData.id,
            tax_id: tax.id,
            calculated_amount: (formData.amount * tax.percentage) / 100,
          }))

          const { error: taxInsertError } = await supabase.from("movement_taxes").insert(movementTaxesData)

          if (taxInsertError) throw taxInsertError
        }

        toast({
          title: "¡Movimiento actualizado con éxito!",
          description: `Se ha actualizado correctamente el movimiento por $${formData.amount.toFixed(2)}`,
          type: "success",
        })

        // Llamar al callback de éxito si existe
        if (onSuccess) {
          onSuccess()
        }
      } else {
        // Lógica existente para crear un nuevo movimiento
        // 1. Create or get entity
        const { data: entityData, error: entityError } = await supabase
          .from("entity")
          .upsert(
            {
              nombre: formData.entityName,
              cuit_cuil: formData.entityId,
            },
            { onConflict: "cuit_cuil" },
          )
          .select()
          .single()

        if (entityError) {
          console.error("Entity error:", entityError)
          throw new Error(`Error al crear la entidad: ${entityError.message}`)
        }

        // 2. Create payment record
        const { data: paymentData, error: paymentError } = await supabase
          .from("payment")
          .insert([
            {
              payment_type: formData.paymentType === "Otro" ? formData.customPaymentType : formData.paymentType,
            },
          ])
          .select()
          .single()

        if (paymentError) throw paymentError

        // 3. Create bill record
        const { data: billData, error: billError } = await supabase
          .from("bills")
          .insert([
            {
              bill_number: formData.billNumber || `AUTO-${Date.now()}`, // Generar un número automático si no se proporciona
              bill_date: formData.billDate,
              bill_amount: formData.amount,
              entity_id: entityData.id,
            },
          ])
          .select()
          .single()

        if (billError) {
          // Manejar específicamente el error de duplicación de número de factura
          if (billError.code === "23505" && billError.message.includes("Bills_bill_number_key")) {
            setBillNumberError("Este número de factura ya existe. Por favor, ingrese uno diferente.")
            toast({
              title: "Error de validación",
              description: "Este número de factura ya existe. Por favor, ingrese uno diferente.",
              variant: "destructive",
            })
            setLoading(false)
            return // Retornar aquí en lugar de lanzar un error
          }
          throw billError
        }

        // 4. Check if category exists and get or create it
        let categoryData
        // First, check if the category exists
        const { data: existingCategories, error: categoryFetchError } = await supabase
          .from("category")
          .select("*")
          .eq("description", formData.category)
          .limit(1)

        if (categoryFetchError) throw categoryFetchError

        if (existingCategories && existingCategories.length > 0) {
          // Category exists, use it
          categoryData = existingCategories[0]
        } else {
          // Category doesn't exist, create it
          const { data: newCategory, error: categoryInsertError } = await supabase
            .from("category")
            .insert([{ description: formData.category }])
            .select()
            .single()

          if (categoryInsertError) throw categoryInsertError
          categoryData = newCategory
        }

        // 5. Check if subcategory exists and get or create it
        let subcategoryData
        // First, check if the subcategory exists
        const { data: existingSubcategories, error: subcategoryFetchError } = await supabase
          .from("sub_category")
          .select("*")
          .eq("description", formData.subCategory)
          .eq("category_id", categoryData.id)
          .limit(1)

        if (subcategoryFetchError) throw subcategoryFetchError

        if (existingSubcategories && existingSubcategories.length > 0) {
          // Subcategory exists, use it
          subcategoryData = existingSubcategories[0]
        } else {
          // Subcategory doesn't exist, create it
          const { data: newSubcategory, error: subcategoryInsertError } = await supabase
            .from("sub_category")
            .insert([
              {
                description: formData.subCategory,
                category_id: categoryData.id,
              },
            ])
            .select()
            .single()

          if (subcategoryInsertError) throw subcategoryInsertError
          subcategoryData = newSubcategory
        }

        // 6. Create operation record
        const { data: operationData, error: operationError } = await supabase
          .from("operations")
          .insert([
            {
              payment_id: paymentData.id,
              bill_id: billData.id,
            },
          ])
          .select()
          .single()

        if (operationError) throw operationError

        // 7. Create movement record with the new tax payment fields
        const { data: movementData, error: movementError } = await supabase
          .from("movements")
          .insert([
            {
              description: formData.description,
              movement_type: formData.movementType,
              operation_id: operationData.id,
              sub_category_id: subcategoryData.id,
              created_by: currentUser.id,
              is_tax_payment: formData.isTaxPayment,
              related_tax_id: formData.isTaxPayment ? formData.relatedTaxId : null,
              check: formData.check,
            },
          ])
          .select()
          .single()

        if (movementError) throw movementError

        // 8. Create movement_taxes records
        if (formData.selectedTaxes.length > 0) {
          const movementTaxesData = formData.selectedTaxes.map((tax: Tax) => ({
            movement_id: movementData.id,
            tax_id: tax.id,
            calculated_amount: (formData.amount * tax.percentage) / 100,
          }))

          const { error: taxError } = await supabase.from("movement_taxes").insert(movementTaxesData)

          if (taxError) throw taxError
        }

        // Mostrar mensaje de éxito
        toast({
          title: "¡Movimiento registrado con éxito!",
          description: `Se ha registrado correctamente el movimiento por $${formData.amount.toFixed(2)}`,
          type: "success",
        })
      }
    } catch (error: any) {
      console.error("Error creating movement:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el movimiento",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }

    // Only reset the form and close the dialog if there were no validation errors
    if (!cuitCuilError && !billNumberError) {
      resetForm()

      // Cerrar el diálogo después de un breve retraso para que el usuario pueda ver el mensaje de éxito
      setTimeout(() => {
        onOpenChange(false)
      }, 500)
    }
  }

  const handleTaxCreated = async () => {
    // Actualizar la lista de impuestos disponibles
    await fetchTaxes()
    setTaxDialogOpen(false)

    // Mostrar mensaje de éxito
    toast({
      title: "Impuesto creado",
      description: "El impuesto ha sido creado correctamente y está disponible para seleccionar",
      type: "success",
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        // Solo permitir cerrar el diálogo si no está cargando
        if (!loading || !newOpen) {
          onOpenChange(newOpen)
        }
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar movimiento" : "Ingresar datos"}</DialogTitle>
          <DialogDescription>Complete los campos para ingresar un nuevo registro.</DialogDescription>
        </DialogHeader>

        <ScrollArea className="pr-4 max-h-[calc(90vh-120px)]">
          <div className="p-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Campo de descripción (ocupa toda la fila) */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev: MovementFormData) => ({ ...prev, description: e.target.value }))
                    }
                    required
                  />
                </div>

                {/* Opción de pago de impuestos (ocupa toda la fila) */}
                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is-tax-payment"
                      checked={formData.isTaxPayment}
                      onCheckedChange={(checked) =>
                        setFormData((prev: MovementFormData) => ({
                          ...prev,
                          isTaxPayment: !!checked,
                          // Si se marca, establecer el tipo de movimiento a egreso
                          // Si se desmarca, limpiar el impuesto relacionado
                          movementType: checked ? "egreso" : prev.movementType,
                          relatedTaxId: checked ? prev.relatedTaxId : null,
                        }))
                      }
                    />
                    <Label htmlFor="is-tax-payment">Este movimiento es un pago de impuesto</Label>
                  </div>
                </div>

                {/* Tipo de movimiento */}
                <div className="space-y-2">
                  <Label>Tipo de movimiento</Label>
                  <div className="flex gap-4 pt-2">
                    {MOVEMENT_TYPES.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`movement-${type}`}
                          checked={formData.movementType === type}
                          onCheckedChange={() =>
                            setFormData((prev: MovementFormData) => ({
                              ...prev,
                              movementType: type as "ingreso" | "egreso" | "inversión",
                            }))
                          }
                          disabled={!!defaultMovementType || formData.isTaxPayment} // Deshabilitar si hay un tipo por defecto o es un pago de impuesto
                        />
                        <Label
                          htmlFor={`movement-${type}`}
                          className={formData.isTaxPayment && type !== "egreso" ? "text-muted-foreground" : ""}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {formData.isTaxPayment && (
                    <p className="text-xs text-muted-foreground mt-1">
                      El tipo de movimiento se establece automáticamente como "Egreso" para pagos de impuestos
                    </p>
                  )}
                </div>

                {/* Selector de impuesto relacionado o campo de monto */}
                {formData.isTaxPayment ? (
                  <div className="space-y-2">
                    <Label htmlFor="related-tax">Tipo de impuesto que se está pagando</Label>
                    <Select
                      value={formData.relatedTaxId ? formData.relatedTaxId.toString() : ""}
                      onValueChange={(value) =>
                        setFormData((prev: MovementFormData) => ({
                          ...prev,
                          relatedTaxId: value ? Number(value) : null,
                        }))
                      }
                    >
                      <SelectTrigger id="related-tax">
                        <SelectValue placeholder="Seleccione el tipo de impuesto" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTaxes.map((tax) => (
                          <SelectItem key={tax.id} value={tax.id.toString()}>
                            {tax.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <button
                      type="button"
                      onClick={() => setTaxDialogOpen(true)}
                      className="text-sm text-[#4F7942] underline mt-1 hover:text-[#3F6932] focus:outline-none"
                    >
                      Agregar nuevo impuesto
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="amount">Monto</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        className="pl-6"
                        value={formData.amount}
                        onChange={(e) =>
                          setFormData((prev: MovementFormData) => ({
                            ...prev,
                            amount: Number.parseFloat(e.target.value),
                          }))
                        }
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Si es pago de impuesto, mostrar el campo de monto aquí */}
                {formData.isTaxPayment && (
                  <div className="space-y-2">
                    <Label htmlFor="amount">Monto</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        className="pl-6"
                        value={formData.amount}
                        onChange={(e) =>
                          setFormData((prev: MovementFormData) => ({
                            ...prev,
                            amount: Number.parseFloat(e.target.value),
                          }))
                        }
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Resto de los campos */}
                <div className="space-y-2">
                  <Label>Forma de pago</Label>
                  <div className="flex gap-4 flex-wrap">
                    {PAYMENT_TYPES.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`payment-${type}`}
                          checked={formData.paymentType === type}
                          onCheckedChange={() =>
                            setFormData((prev: MovementFormData) => ({ ...prev, paymentType: type }))
                          }
                        />
                        <Label htmlFor={`payment-${type}`}>{type}</Label>
                      </div>
                    ))}
                  </div>
                  {formData.paymentType === "Otro" && (
                    <div className="mt-2">
                      <Label htmlFor="customPaymentType">Especifique el método de pago</Label>
                      <Input
                        id="customPaymentType"
                        value={formData.customPaymentType}
                        onChange={(e) =>
                          setFormData((prev: MovementFormData) => ({ ...prev, customPaymentType: e.target.value }))
                        }
                        placeholder="Ingrese el método de pago"
                        required={formData.paymentType === "Otro"}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Rubro</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData((prev: MovementFormData) => ({ ...prev, category: e.target.value }))}
                    required
                    disabled={formData.isTaxPayment} // Deshabilitar si es un pago de impuesto
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subCategory">Sub-rubro</Label>
                  <Input
                    id="subCategory"
                    value={formData.subCategory}
                    onChange={(e) =>
                      setFormData((prev: MovementFormData) => ({ ...prev, subCategory: e.target.value }))
                    }
                    required
                    disabled={formData.isTaxPayment} // Deshabilitar si es un pago de impuesto
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billNumber">
                    Número de factura{" "}
                    {!isBillNumberRequired && (
                      <span className="text-sm text-muted-foreground">(opcional para ingresos)</span>
                    )}
                  </Label>
                  <Input
                    id="billNumber"
                    value={formData.billNumber}
                    onChange={(e) => setFormData((prev: MovementFormData) => ({ ...prev, billNumber: e.target.value }))}
                    required={isBillNumberRequired}
                    className={billNumberError ? "border-red-500" : ""}
                  />
                  {billNumberError && <p className="text-sm text-red-500 mt-1">{billNumberError}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billDate">Fecha de facturación</Label>
                  <Input
                    id="billDate"
                    type="date"
                    value={formData.billDate}
                    onChange={(e) => setFormData((prev: MovementFormData) => ({ ...prev, billDate: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Entidad</Label>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Nombre de la entidad"
                        value={formData.entityName}
                        readOnly
                        className="bg-muted"
                      />
                      <Input placeholder="CUIT/CUIL" value={formData.entityId} readOnly className="bg-muted" />
                    </div>
                    <Button type="button" variant="outline" onClick={() => setEntitySelectorOpen(true)}>
                      Seleccionar
                    </Button>
                  </div>
                </div>

                {/* Solo mostrar la selección de impuestos si NO es un pago de impuesto */}
                {!formData.isTaxPayment && (
                  <div className="space-y-2 col-span-2">
                    <TaxSelection
                      availableTaxes={availableTaxes}
                      selectedTaxes={formData.selectedTaxes}
                      transactionAmount={formData.amount}
                      movementType={formData.movementType}
                      onTaxSelect={(tax) =>
                        setFormData((prev: MovementFormData) => ({
                          ...prev,
                          selectedTaxes: [...prev.selectedTaxes, tax],
                        }))
                      }
                      onTaxRemove={(taxId) =>
                        setFormData((prev: MovementFormData) => ({
                          ...prev,
                          selectedTaxes: prev.selectedTaxes.filter((t) => t.id !== taxId),
                        }))
                      }
                      onAddNewTax={() => setTaxDialogOpen(true)}
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="check"
                    checked={formData.check}
                    onCheckedChange={(checked) => {
                      setFormData((prev) => ({
                        ...prev,
                        check: checked as boolean,
                      }))
                    }}
                  />
                  <Label htmlFor="check">Marcar como verificado</Label>
                </div>
              </div>

              <Button type="submit" className="w-full bg-[#4F7942] hover:bg-[#3F6932]" disabled={loading}>
                {loading ? "Enviando..." : isEditMode ? "Actualizar" : "Enviar"}
              </Button>
            </form>
          </div>
        </ScrollArea>

        <EntitySelector
          open={entitySelectorOpen}
          onOpenChange={setEntitySelectorOpen}
          onSelectEntity={(entity) => {
            setFormData((prev) => ({
              ...prev,
              entityName: entity.nombre,
              entityId: entity.cuit_cuil,
            }))
          }}
          onCreateNewEntity={() => {
            setEntitySelectorOpen(false)
            setEntityFormOpen(true)
          }}
        />

        <EntityForm
          open={entityFormOpen}
          onOpenChange={setEntityFormOpen}
          onEntityCreated={(entity) => {
            setFormData((prev) => ({
              ...prev,
              entityName: entity.nombre,
              entityId: entity.cuit_cuil,
            }))
            setEntityFormOpen(false)
          }}
        />

        <TaxDialog open={taxDialogOpen} onOpenChange={setTaxDialogOpen} onTaxCreated={handleTaxCreated} />
      </DialogContent>
    </Dialog>
  )
}

