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
  existingData?: any
  onSuccess?: () => void
  user?: any
  hideCheckField?: boolean
}

export function MovementForm({
  open,
  onOpenChange,
  defaultMovementType,
  isEditMode = false,
  existingData = null,
  onSuccess,
  user,
  hideCheckField = false,
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
    amount: "", 
    category: "",
    subCategory: "",
    billNumber: "",
    billDate: "",
    entityName: "",
    entityId: "",
    entityCuitCuil: "",
    selectedTaxes: [],
    isTaxPayment: false,
    relatedTaxId: null,
    check: false,
  })
  const [billNumberError, setBillNumberError] = useState<string | null>(null)
  const [cuitCuilError, setCuitCuilError] = useState<string | null>(null)
  const [showErrors, setShowErrors] = useState(false)
  const isBillNumberRequired = formData.movementType !== "ingreso"
  const isAdmin = user?.type === "admin"
  const isInternal = user?.type === "local"

  // Helper para crear entidad (siempre por API)
  const handleCreateEntity = async (nombre: string, cuit_cuil: string) => {
    const res = await fetch("/api/create-entity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, cuit_cuil }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Error creando entidad");
    return result.entity;
  };

  // Helper para crear impuesto (siempre por API)
  const handleCreateTax = async (name: string, percentage: number) => {
    const res = await fetch("/api/create-tax", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, percentage }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Error creando impuesto");
    return result.tax;
  };

  useEffect(() => {
    if (open) {
      fetchTaxes()
      if (user) {
        setCurrentUser(user)
      } else {
        getCurrentUser()
      }
    }
    // eslint-disable-next-line
  }, [open, user])

  useEffect(() => {
    if (isEditMode && existingData && open) {
      let formattedDate = existingData.fechaComprobante || ""
      if (formattedDate) {
        try {
          const date = new Date(formattedDate)
          formattedDate = date.toISOString().split("T")[0]
        } catch (error) {
          console.error("Error formatting date:", error)
        }
      }
      // Si no viene el cuit_cuil, intentar obtenerlo de la entidad asociada
      let entityCuitCuil = existingData.entityCuitCuil || existingData.cuit_cuil || (existingData.entity && existingData.entity.cuit_cuil) || "";
      let entityName = existingData.empresa || (existingData.entity && existingData.entity.nombre) || "";
      let entityId = existingData.entityId || (existingData.entity && existingData.entity.id) || "";
      setFormData((prev) => ({
        ...prev,
        description: existingData.detalle ?? prev.description ?? "",
        movementType: existingData.movimiento ?? prev.movementType ?? defaultMovementType ?? "ingreso",
        paymentType: existingData.formaPago ?? prev.paymentType ?? "",
        customPaymentType:
          (existingData.formaPago && !PAYMENT_TYPES.includes(existingData.formaPago)) ? existingData.formaPago : (prev.customPaymentType ?? ""),
        amount: existingData.importe ?? prev.amount ?? 0,
        category: existingData.rubro ?? prev.category ?? "",
        subCategory: existingData.subrubro ?? prev.subCategory ?? "",
        billNumber: existingData.factura ?? prev.billNumber ?? "",
        billDate: formattedDate ?? prev.billDate ?? "",
        entityName: entityName || prev.entityName || "",
        entityId: entityId || prev.entityId || "",
        entityCuitCuil: entityCuitCuil || prev.entityCuitCuil || "",
        selectedTaxes: existingData.taxes ?? prev.selectedTaxes ?? [],
        isTaxPayment: existingData.isTaxPayment ?? prev.isTaxPayment ?? false,
        relatedTaxId: existingData.relatedTaxId ?? prev.relatedTaxId ?? null,
        check: existingData.check ?? prev.check ?? false,
      }))
    }
    // eslint-disable-next-line
  }, [isEditMode, existingData, open, defaultMovementType])

  useEffect(() => {
    if (billNumberError) setBillNumberError(null)
  }, [formData.billNumber])

  useEffect(() => {
    if (formData.isTaxPayment) {
      setFormData((prev) => ({
        ...prev,
        category: "Impuestos y Tasas",
        subCategory: prev.relatedTaxId
          ? availableTaxes.find((tax) => tax.id === prev.relatedTaxId)?.name || "Pago de Impuesto"
          : "Pago de Impuesto",
        movementType: "egreso",
      }))
    }
    // eslint-disable-next-line
  }, [formData.isTaxPayment, formData.relatedTaxId, availableTaxes])

  const getCurrentUser = async () => {
    try {
      const { data, error } = await supabase.auth.getUser()
      if (error) throw error
      setCurrentUser(data.user)
    } catch (error) {
      console.error("Error getting current user:", error)
    }
  }
  const fetchTaxes = async () => {
    if (isInternal) {
     // Usuarios internos: fetch a la API (usa service key)
      const res = await fetch('/api/taxes');
      const json = await res.json();
      setAvailableTaxes(json.taxes || []);
    } else {
      // Admins: directo a Supabase
      const { data, error } = await supabase.from("taxes").select("*");
      setAvailableTaxes(data || []);
   }
  };

  const resetForm = () => {
    setFormData({
      description: "",
      movementType: "ingreso",
      paymentType: "",
      customPaymentType: "",
      amount: "",
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

  const checkBillNumberExists = async (billNumber: string): Promise<boolean> => {
    if (!billNumber.trim()) return false
    const { data, error } = await supabase.from("bills").select("bill_number").eq("bill_number", billNumber).limit(1)
    if (error) {
      console.error("Error checking bill number:", error)
      return false
    }
    return data && data.length > 0
  }

  // ---- ADAPTADO: handleSubmit bifurca creación de entidad por helpers ----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setBillNumberError(null);
    setShowErrors(true);

    try {
      if (!currentUser || !currentUser.id) {
        throw new Error("Debe iniciar sesión para realizar esta acción");
      }

      if (isEditMode && existingData && existingData.id) {
        // --- EDICIÓN DE MOVIMIENTO: SOLO CAMPOS MODIFICADOS ---
        setLoading(true);
        try {
          // Detectar campos modificados
          const changedFields: any = { movementId: existingData.id };
          const keys = [
            "entityName",
            "entityCuitCuil",
            "paymentType",
            "customPaymentType",
            "billNumber",
            "billDate",
            "amount",
            "category",
            "subCategory",
            "isTaxPayment",
            "relatedTaxId",
            "check",
            "selectedTaxes",
            "description",
            "movementType",
          ];
          keys.forEach((key) => {
            // Para selectedTaxes, comparar por JSON.stringify
            if (key === "selectedTaxes") {
              if (JSON.stringify(formData.selectedTaxes) !== JSON.stringify(existingData.taxes || [])) {
                changedFields.selectedTaxes = formData.selectedTaxes;
              }
            } else if (formData[key] !== (existingData[key] ?? "")) {
              changedFields[key] = formData[key];
            }
          });
          // Si no hay cambios, no enviar
          if (Object.keys(changedFields).length === 1) {
            toast({ title: "Sin cambios", description: "No se detectaron cambios para actualizar.", type: "info" });
            setLoading(false);
            return;
          }
          const res = await fetch("/api/edit-movement", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(changedFields),
          });
          const result = await res.json();
          if (!res.ok) {
            throw new Error(result.error || "Error actualizando movimiento");
          }
          toast({
            title: "¡Movimiento actualizado con éxito!",
            description: `Se ha actualizado correctamente el movimiento por $${formData.amount.toFixed(2)}`,
            type: "success",
          });
          if (onSuccess) onSuccess();
          setTimeout(() => {
            onOpenChange(false);
          }, 500);
        } catch (error: any) {
          toast({
            title: "Error actualizando movimiento",
            description: error.message || "No se pudo actualizar el movimiento",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
        return;
      } else {
        // --- CREACIÓN NUEVO MOVIMIENTO CENTRALIZADA EN API ---
        // Forzar check a false para usuarios internos
        const checkValue = isInternal ? false : formData.check;
        const res = await fetch("/api/create-movement", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            user_id: currentUser.id,
            entityId: formData.entityId || "",
            entityCuitCuil: formData.entityCuitCuil || "",
            check: checkValue,
          }),
        });
        const result = await res.json();
        if (res.status === 409) {
          setBillNumberError(result.error);
          setLoading(false);
          return;
        }
        if (!res.ok) {
          throw new Error(result.error || "Error creando movimiento");
        }
        toast({
          title: "¡Movimiento registrado con éxito!",
          description: "El movimiento fue creado correctamente.",
          type: "success",
        });
        resetForm();
        setTimeout(() => {
          onOpenChange(false);
          if (onSuccess) onSuccess();
        }, 500);
      }
    } catch (error: any) {
      console.error("Error creating movement:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el movimiento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
    if (!cuitCuilError && !billNumberError) {
      resetForm();
      setTimeout(() => {
        onOpenChange(false);
      }, 500);
    }
  }
  const handleTaxCreated = async (taxName: string, percentage: number) => {
    try {
      await handleCreateTax(taxName, percentage)
      await fetchTaxes()
      setTaxDialogOpen(false)
      toast({
        title: "Impuesto creado",
        description: "El impuesto ha sido creado correctamente y está disponible para seleccionar",
        type: "success",
      })
    } catch (error: any) {
      toast({
        title: "Error creando impuesto",
        description: error.message || "No se pudo crear el impuesto",
        variant: "destructive",
      })
    }
  }
  

  // Mover isFormValid aquí para acceder a formData
  const isFormValid = () => {
    // En edición, permitir que los datos de entidad vengan de existingData si no se modificaron
    const entityName = formData.entityName || (isEditMode && existingData && (existingData.empresa || (existingData.entity && existingData.entity.nombre))) || "";
    const entityId = formData.entityId || (isEditMode && existingData && (existingData.entityId || (existingData.entity && existingData.entity.id))) || "";
    const entityCuitCuil = formData.entityCuitCuil || (isEditMode && existingData && (existingData.entityCuitCuil || existingData.cuit_cuil || (existingData.entity && existingData.entity.cuit_cuil))) || "";
    return (
      formData.description.trim() &&
      formData.amount && Number(formData.amount) > 0 &&
      formData.paymentType &&
      formData.movementType &&
      formData.category.trim() &&
      formData.subCategory.trim() &&
      formData.billNumber.trim() &&
      formData.billDate &&
      entityName.trim() &&
      entityId &&
      entityCuitCuil // <-- ahora es obligatorio
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!loading || !newOpen) {
          onOpenChange(newOpen)
        }
      }}
    >
      <DialogContent
        className={`max-w-4xl max-h-[90vh]`}
        hideCloseButton={user?.type === "local"}
        hideOverlay={user?.type === "local"} // <--- agrega esto
      >
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

                {formData.description.trim() === "" && showErrors && (
                  <p className="text-xs text-red-500">La descripción es obligatoria.</p>
                )}

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
                  <div className="flex gap-4 pt-2" role="group" aria-labelledby="tipo-movimiento-label">
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
                          disabled={!!defaultMovementType || formData.isTaxPayment}
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
                {!formData.movementType && showErrors && (
                  <p className="text-xs text-red-500">Debes seleccionar un tipo de movimiento.</p>
                )}

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
                      <Input placeholder="CUIT/CUIL" value={formData.entityCuitCuil} readOnly className="bg-muted" />
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

              {!hideCheckField && (
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
              )}
              </div>

              <Button
                type="submit"
                className="w-full bg-[#4F7942] hover:bg-[#3F6932]"
                disabled={loading || !isFormValid()}
              >
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
              entityId: entity.id,
              entityCuitCuil: entity.cuit_cuil, // solo este campo
            }))
            setEntitySelectorOpen(false)
          }}
          onCreateNewEntity={() => {
            setEntitySelectorOpen(false)
            setEntityFormOpen(true)
          }}
          user={user}
        />

        <EntityForm
          open={entityFormOpen}
          onOpenChange={setEntityFormOpen}
          onEntityCreated={async (nombre, cuit_cuil) => {
            try {
              const entity = await handleCreateEntity(nombre, cuit_cuil)
              setFormData((prev) => ({
                ...prev,
                entityName: entity.nombre,
                entityId: entity.id,
                entityCuitCuil: entity.cuit_cuil, // solo este campo
              }))
              setEntityFormOpen(false)
            } catch (error) {
              console.error("Error al crear entidad:", error)
            }
          }}
        />

        <TaxDialog open={taxDialogOpen} onOpenChange={setTaxDialogOpen} onTaxCreated={handleTaxCreated} />
      </DialogContent>
    </Dialog>
  )
}

