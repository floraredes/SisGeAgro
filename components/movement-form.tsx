"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/simple-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { TaxDialog } from "./tax-dialog"
import { supabase } from "@/lib/supabase/supabaseClient"
import { getCurrentUser } from "@/lib/auth-utils"
import type { MovementFormData, Tax } from "@/types/forms"
import { TaxSelection } from "./tax-selection"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { EntitySelector } from "./entity-selector"
import { EntityForm } from "./entity-form"
import { ChevronDown } from "lucide-react"

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
  const [categories, setCategories] = useState<{ id: string; name: string; description: string }[]>([])
  const [subcategories, setSubcategories] = useState<{ id: string; name: string; description: string; category_id: string }[]>([])
  const [filteredSubcategories, setFilteredSubcategories] = useState<{ id: string; name: string; description: string; category_id: string }[]>([])
  const [filteredCategories, setFilteredCategories] = useState<{ id: string; name: string; description: string }[]>([])
  const [searchableSubcategories, setSearchableSubcategories] = useState<{ id: string; name: string; description: string; category_id: string }[]>([])
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [subcategoryOpen, setSubcategoryOpen] = useState(false)
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newSubcategories, setNewSubcategories] = useState<string[]>([""]);
  const [savingCategory, setSavingCategory] = useState(false);

  // Estados para el modal de subrubros
  const [showEditSubcategoryModal, setShowEditSubcategoryModal] = useState(false);
  const [editSubcategories, setEditSubcategories] = useState<string[]>([]);
  const [editSubcategoryIds, setEditSubcategoryIds] = useState<(string|null)[]>([]);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [savingSubcategories, setSavingSubcategories] = useState(false);

  // Cerrar dropdowns cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.category-dropdown') && !target.closest('.subcategory-dropdown')) {
        setCategoryOpen(false);
        setSubcategoryOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  const [formData, setFormData] = useState<MovementFormData>({
    description: "",
    movementType: defaultMovementType || "ingreso",
    paymentType: "",
    customPaymentType: "",
    amount: 0, 
    category: "",
    subCategory: "",
    categoryText: "",
    subCategoryText: "",
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
      console.log('🔄 [MovementForm] Form opened, fetching data...');
      fetchTaxes()
      fetchCategories()
      fetchSubcategories()
      if (user) {
        setCurrentUser(user)
      } else {
        getCurrentUser().then(setCurrentUser).catch((error) => {
          console.error("Error getting current user:", error)
        })
      }
    }
    // eslint-disable-next-line
  }, [open, user])

  // Log cuando availableTaxes cambia
  useEffect(() => {
    console.log('📊 [MovementForm] availableTaxes updated:', availableTaxes);
  }, [availableTaxes]);

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
          ? availableTaxes.find((tax) => tax.id === prev.relatedTaxId?.toString())?.name || "Pago de Impuesto"
          : "Pago de Impuesto",
        movementType: "egreso",
      }))
    }
    // eslint-disable-next-line
  }, [formData.isTaxPayment, formData.relatedTaxId, availableTaxes])

  const fetchTaxes = async () => {
    try {
      // Siempre usar la API para tener permisos completos
      const res = await fetch('/api/taxes');
      if (res.ok) {
        const json = await res.json();
        console.log('✅ [MovementForm] Taxes loaded from API:', json.taxes);
        setAvailableTaxes(json.taxes || []);
      } else {
        console.error('❌ [MovementForm] Error en fetchTaxes - Status:', res.status);
        const errorText = await res.text();
        console.error('❌ [MovementForm] Error response:', errorText);
      }
    } catch (error) {
      console.error('❌ [MovementForm] Error fetching taxes:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
        setFilteredCategories(data.categories || []);
      } else {
        console.error('❌ [MovementForm] Error en fetchCategories - Status:', response.status)
        const errorText = await response.text();
        console.error('❌ [MovementForm] Error response:', errorText)
      }
    } catch (error) {
      console.error('❌ [MovementForm] Error fetching categories:', error);
    }
  };

  const fetchSubcategories = async () => {
    try {
      const response = await fetch('/api/subcategories');
      
      if (response.ok) {
        const data = await response.json();
        setSubcategories(data.subcategories || []);
      } else {
        console.error('❌ [MovementForm] Error en fetchSubcategories - Status:', response.status)
        const errorText = await response.text();
        console.error('❌ [MovementForm] Error response:', errorText)
      }
    } catch (error) {
      console.error('❌ [MovementForm] Error fetching subcategories:', error);
    }
  };

  // Filtrar subcategorías cuando cambia la categoría seleccionada
  useEffect(() => {
    if (formData.category) {
      const filtered = subcategories.filter(sub => {
        const categoryId = typeof formData.category === 'string' ? parseInt(formData.category) : formData.category;
        return sub.category_id === categoryId;
      });
      setFilteredSubcategories(filtered);
      setSearchableSubcategories(filtered);
    } else {
      setFilteredSubcategories([]);
      setSearchableSubcategories([]);
    }
  }, [formData.category, subcategories]);

  const resetForm = () => {
    setFormData({
      description: "",
      movementType: "ingreso",
      paymentType: "",
      customPaymentType: "",
      amount: 0,
      category: "",
      subCategory: "",
      categoryText: "",
      subCategoryText: "",
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
  const handleTaxCreated = async (taxName: string, percentage: number | null) => {
    try {
      console.log('🔄 [MovementForm] Creating tax:', { taxName, percentage });
      const result = await handleCreateTax(taxName, percentage || 0);
      console.log('✅ [MovementForm] Tax created successfully:', result);
      
      // Esperar un poco antes de refrescar la lista
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('🔄 [MovementForm] Refreshing taxes list...');
      await fetchTaxes();
      
      setTaxDialogOpen(false);
      toast({
        title: "Impuesto creado",
        description: "El impuesto ha sido creado correctamente y está disponible para seleccionar",
        type: "success",
      });
    } catch (error: any) {
      console.error('❌ [MovementForm] Error in handleTaxCreated:', error);
      toast({
        title: "Error creando impuesto",
        description: error.message || "No se pudo crear el impuesto",
        variant: "destructive",
      });
    }
  }
  

  // Mover isFormValid aquí para acceder a formData
  const isFormValid = () => {
    // En edición, permitir que los datos de entidad vengan de existingData si no se modificaron
    const entityName = formData.entityName || (isEditMode && existingData && (existingData.empresa || (existingData.entity && existingData.entity.nombre))) || "";
    const entityId = formData.entityId || (isEditMode && existingData && (existingData.entityId || (existingData.entity && existingData.entity.id))) || "";
    const entityCuitCuil = formData.entityCuitCuil || (isEditMode && existingData && (existingData.entityCuitCuil || existingData.cuit_cuil || (existingData.entity && existingData.entity.cuit_cuil))) || "";
    
    // Convertir category y subCategory a string antes de usar trim()
    const categoryStr = String(formData.category || "");
    const subCategoryStr = String(formData.subCategory || "");
    
    return (
      formData.description.trim() &&
      formData.amount && Number(formData.amount) > 0 &&
      formData.paymentType &&
      formData.movementType &&
      categoryStr.trim() &&
      subCategoryStr.trim() &&
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
          onOpenChange(newOpen);
          if (!newOpen) {
            resetForm();
          }
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
                    value={formData.description || ""}
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
                        value={formData.amount || ""}
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
                        value={formData.amount || ""}
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
                        value={formData.customPaymentType || ""}
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
                  <div className="relative category-dropdown flex items-center gap-2">
                    <Input
                      placeholder="Buscar rubro..."
                      value={formData.categoryText || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData((prev: MovementFormData) => ({ 
                          ...prev, 
                          categoryText: value,
                          category: "" // Limpiar la categoría seleccionada cuando se escribe
                        }));
                        
                        const searchTerm = value.toLowerCase();
                        const filtered = categories.filter(cat => 
                          cat.description.toLowerCase().includes(searchTerm)
                        );
                        setFilteredCategories(filtered);
                        setCategoryOpen(true);
                      }}
                      onFocus={() => {
                        setCategoryOpen(true);
                        setFilteredCategories(categories);
                      }}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => setShowAddCategoryModal(true)}
                      title="Agregar rubro y subrubros"
                    >
                      +
                    </Button>
                    {categoryOpen && (
                      <div className="absolute top-full left-0 right-0 bg-background border rounded-md shadow-lg z-50 max-h-[200px] overflow-y-auto">
                        {filteredCategories.length > 0 ? (
                          filteredCategories.map((category) => (
                            <div
                              key={category.id}
                              className="p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer border-b last:border-b-0"
                              onClick={() => {
                                setFormData((prev: MovementFormData) => ({ 
                                  ...prev, 
                                  category: category.id,
                                  categoryText: category.description,
                                  subCategory: "" // Resetear subcategoría cuando cambia la categoría
                                }))
                                setCategoryOpen(false)
                              }}
                            >
                              {category.description}
                            </div>
                          ))
                        ) : (
                          <div className="p-2 text-muted-foreground text-center">
                            No se encontró ningún rubro.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub-rubro */}
                <div className="space-y-2">
                  <Label htmlFor="subCategory">Sub-rubro</Label>
                  <div className="relative subcategory-dropdown flex items-center gap-2">
                    <Input
                      placeholder={formData.category ? "Buscar sub-rubro..." : "Primero seleccione un rubro"}
                      value={formData.subCategoryText || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData((prev: MovementFormData) => ({ 
                          ...prev, 
                          subCategoryText: value,
                          subCategory: "" // Limpiar la subcategoría seleccionada cuando se escribe
                        }));
                        const searchTerm = value.toLowerCase();
                        const filtered = searchableSubcategories.filter(sub => 
                          sub.description.toLowerCase().includes(searchTerm)
                        );
                        setFilteredSubcategories(filtered);
                        setSubcategoryOpen(true);
                      }}
                      onFocus={() => {
                        if (formData.category) {
                          setSubcategoryOpen(true);
                          setFilteredSubcategories(searchableSubcategories);
                        }
                      }}
                      disabled={!formData.category || formData.isTaxPayment}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={async () => {
                        if (!formData.category) return;
                        // Obtener nombre del rubro seleccionado
                        const cat = categories.find(c => c.id === formData.category);
                        setEditCategoryName(cat ? cat.description : "");
                        // Obtener subrubros actuales de ese rubro
                        const subs = subcategories.filter(sub => sub.category_id === formData.category);
                        setEditSubcategories(subs.map(s => s.description));
                        setEditSubcategoryIds(subs.map(s => s.id));
                        setShowEditSubcategoryModal(true);
                      }}
                      title="Editar/agregar subrubros"
                      disabled={!formData.category}
                    >
                      +
                    </Button>
                    {subcategoryOpen && formData.category && (
                      <div className="absolute top-full left-0 right-0 bg-background border rounded-md shadow-lg z-50 max-h-[200px] overflow-y-auto">
                        {filteredSubcategories.length > 0 ? (
                          filteredSubcategories.map((subcategory) => (
                            <div
                              key={subcategory.id}
                              className="p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer border-b last:border-b-0"
                              onClick={() => {
                                setFormData((prev: MovementFormData) => ({ 
                                  ...prev, 
                                  subCategory: subcategory.id,
                                  subCategoryText: subcategory.description
                                }))
                                setSubcategoryOpen(false)
                              }}
                            >
                              {subcategory.description}
                            </div>
                          ))
                        ) : (
                          <div className="p-2 text-muted-foreground text-center">
                            No se encontró ningún sub-rubro.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
                    value={formData.billNumber || ""}
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
                    value={formData.billDate || ""}
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
                        value={formData.entityName || ""}
                        readOnly
                        className="bg-muted"
                      />
                      <Input placeholder="CUIT/CUIL" value={formData.entityCuitCuil || ""} readOnly className="bg-muted" />
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
           key={entitySelectorOpen ? 'open' : 'closed'} // Forzar re-render cuando se abre
         />

                 <EntityForm
           open={entityFormOpen}
           onOpenChange={setEntityFormOpen}
           onEntityCreated={async (nombre, cuit_cuil) => {
             try {
               console.log('🔄 [MovementForm] Creating entity:', { nombre, cuit_cuil });
               const entity = await handleCreateEntity(nombre, cuit_cuil)
               console.log('✅ [MovementForm] Entity created successfully:', entity);
               
               setFormData((prev) => ({
                 ...prev,
                 entityName: entity.nombre,
                 entityId: entity.id,
                 entityCuitCuil: entity.cuit_cuil, // solo este campo
               }))
               
               // Reabrir el selector de entidades para mostrar la nueva entidad
               setEntityFormOpen(false)
               setTimeout(() => {
                 setEntitySelectorOpen(true)
               }, 100)
             } catch (error) {
               console.error("Error al crear entidad:", error)
             }
           }}
         />

        <TaxDialog open={taxDialogOpen} onOpenChange={setTaxDialogOpen} onTaxCreated={handleTaxCreated} />
        {/* Modal para agregar rubro y subrubros */}
        <Dialog open={showAddCategoryModal} onOpenChange={(open) => {
          setShowAddCategoryModal(open);
          if (!open) {
            setNewCategory("");
            setNewSubcategories([""]);
          }
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Agregar nuevo rubro y subrubros</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre del rubro</label>
                <Input value={newCategory || ""} onChange={e => setNewCategory(e.target.value)} placeholder="Ej: Insumos" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subrubros</label>
                {newSubcategories.map((sub, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <Input
                      value={sub || ""}
                      onChange={e => {
                        const arr = [...newSubcategories];
                        arr[idx] = e.target.value;
                        setNewSubcategories(arr);
                      }}
                      placeholder={`Subrubro ${idx + 1}`}
                    />
                    <Button type="button" size="icon" variant="ghost" onClick={() => setNewSubcategories(arr => arr.filter((_, i) => i !== idx))} disabled={newSubcategories.length === 1}>-</Button>
                  </div>
                ))}
                <Button type="button" size="sm" variant="outline" onClick={() => setNewSubcategories(arr => [...arr, ""])}>Agregar subrubro</Button>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={async () => {
                if (!newCategory.trim()) return;
                setSavingCategory(true);
                // Crear rubro
                const resCat = await fetch("/api/create-category", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ description: newCategory })
                });
                const catData = await resCat.json();
                if (!catData.id) {
                  setSavingCategory(false);
                  return;
                }
                // Crear subrubros
                for (const sub of newSubcategories) {
                  if (sub.trim()) {
                    await fetch("/api/create-subcategory", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ description: sub, category_id: catData.id })
                    });
                  }
                }
                // Refrescar combos
                await fetchCategories();
                await fetchSubcategories();
                setShowAddCategoryModal(false);
                setNewCategory("");
                setNewSubcategories([""]);
                setSavingCategory(false);
              }} disabled={savingCategory}>
                Guardar
              </Button>
              <Button type="button" variant="ghost" onClick={() => {
                setShowAddCategoryModal(false);
                setNewCategory("");
                setNewSubcategories([""]);
              }} disabled={savingCategory}>Cancelar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal para editar/agregar subrubros */}
        <Dialog open={showEditSubcategoryModal} onOpenChange={(open) => {
          setShowEditSubcategoryModal(open);
          if (!open) {
            setEditSubcategories([]);
            setEditSubcategoryIds([]);
            setEditCategoryName("");
          }
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar/agregar subrubros</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Rubro seleccionado</label>
                <div className="bg-muted border border-input rounded-md px-3 py-2 text-sm text-muted-foreground">
                  {editCategoryName}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subrubros</label>
                {editSubcategories.map((sub, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <Input
                      value={sub || ""}
                      onChange={e => {
                        const arr = [...editSubcategories];
                        arr[idx] = e.target.value;
                        setEditSubcategories(arr);
                      }}
                      placeholder={`Subrubro ${idx + 1}`}
                    />
                  </div>
                ))}
                <Button type="button" size="sm" variant="outline" onClick={() => setEditSubcategories(arr => [...arr, ""])}>Agregar subrubro</Button>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={async () => {
                if (!formData.category) return;
                setSavingSubcategories(true);
                // Actualizar o crear subrubros
                for (let i = 0; i < editSubcategories.length; i++) {
                  const desc = editSubcategories[i].trim();
                  if (!desc) continue;
                  const id = editSubcategoryIds[i];
                  if (id) {
                    // Actualizar subrubro existente
                    await fetch("/api/create-subcategory", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id, description: desc, category_id: formData.category })
                    });
                  } else {
                    // Crear nuevo subrubro
                    await fetch("/api/create-subcategory", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ description: desc, category_id: formData.category })
                    });
                  }
                }
                await fetchSubcategories();
                setShowEditSubcategoryModal(false);
                setEditSubcategories([]);
                setEditSubcategoryIds([]);
                setEditCategoryName("");
                setSavingSubcategories(false);
              }} disabled={savingSubcategories}>
                Guardar
              </Button>
              <Button type="button" variant="ghost" onClick={() => {
                setShowEditSubcategoryModal(false);
                setEditSubcategories([]);
                setEditSubcategoryIds([]);
                setEditCategoryName("");
              }} disabled={savingSubcategories}>Cancelar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}

