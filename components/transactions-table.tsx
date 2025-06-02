"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, Edit, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabase/supabaseClient"
import { MovementForm } from "./movement-form"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog"
import { useToast } from "@/components/ui/simple-toast"
// Importar el hook useCurrency
import { useCurrency } from "@/contexts/currency-context"
import { Checkbox } from "@/components/ui/checkbox"

// Definición de tipos
interface Transaction {
  id: string
  detalle: string
  empresa: string
  formaPago: string
  fechaComprobante: string
  factura: string
  movimiento: "ingreso" | "egreso" | "inversión"
  rubro: string
  subrubro: string
  importe: number
  percepcion: number
  categoryId?: string
  subcategoryId?: string
  entityId?: string
  check: boolean
}

// Definición de columnas disponibles
const ALL_COLUMNS = [
  { id: "check", label: "VERIFICADO" },
  { id: "detalle", label: "DETALLE" },
  { id: "empresa", label: "EMPRESA" },
  { id: "formaPago", label: "FORMA DE PAGO" },
  { id: "fechaComprobante", label: "FECHA COMPROBANTE" },
  { id: "factura", label: "FACTURA" },
  { id: "movimiento", label: "MOVIMIENTO" },
  { id: "rubro", label: "RUBRO" },
  { id: "subrubro", label: "SUBRUBRO" },
  { id: "importe", label: "IMPORTE" },
  { id: "percepcion", label: "PERCEPCIÓN" },
  { id: "importeFinal", label: "IMPORTE FINAL" },
]

interface TransactionsTableProps {
  movementType?: "ingreso" | "egreso" | "inversión" | "all"
  showMovementTypeFilter?: boolean
  title?: string
}

export function TransactionsTable({
  movementType = "all",
  showMovementTypeFilter = true,
  title,
}: TransactionsTableProps) {
  // Agregar el hook de moneda
  const { formatCurrency } = useCurrency()
  // Estados para datos y filtros
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]) // Almacena todos los datos sin filtrar
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>(movementType !== "all" ? movementType : "")
  const [categoryFilter, setCategoryFilter] = useState<string>("")
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>("")
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>("")
  const [entityFilter, setEntityFilter] = useState<string>("")

  // Estados para opciones de visualización
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    ALL_COLUMNS.filter((col) => movementType === "all" || col.id !== "movimiento") // Ocultar columna de movimiento si es específico
      .map((col) => col.id),
  )

  // Estados para datos de filtros
  const [categories, setCategories] = useState<{ id: string; description: string }[]>([])
  const [subcategories, setSubcategories] = useState<{ id: string; description: string; category_id: string }[]>([])
  const [paymentTypes, setPaymentTypes] = useState<string[]>([])
  const [entities, setEntities] = useState<{ id: string; nombre: string }[]>([])

  // Estado para el formulario de movimientos
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Estados para diálogos de edición y eliminación
  const [selectedMovement, setSelectedMovement] = useState<Transaction | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Estado para el menú contextual
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    show: boolean
  } | null>(null)

  // Cargar datos iniciales
  useEffect(() => {
    fetchFilterOptions()
    fetchTransactions()
  }, [movementTypeFilter]) // Solo recargamos cuando cambia el tipo de movimiento

  // Aplicar filtros en el lado del cliente
  useEffect(() => {
    applyFilters()
  }, [allTransactions, categoryFilter, subcategoryFilter, paymentTypeFilter, entityFilter, searchTerm, currentPage])

  // Cerrar el menú contextual al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null)
    }

    document.addEventListener("click", handleClickOutside)
    return () => {
      document.removeEventListener("click", handleClickOutside)
    }
  }, [])

  // Función para aplicar filtros en el lado del cliente
  const applyFilters = () => {
    if (!allTransactions.length) {
      setTransactions([])
      setTotalItems(0)
      return
    }

    let filteredData = [...allTransactions]

    // Aplicar filtro de categoría
    if (categoryFilter && categoryFilter !== "all") {
      filteredData = filteredData.filter((item) => item.categoryId === categoryFilter)
    }

    // Aplicar filtro de subcategoría
    if (subcategoryFilter && subcategoryFilter !== "all") {
      filteredData = filteredData.filter((item) => item.subcategoryId === subcategoryFilter)
    }

    // Aplicar filtro de forma de pago
    if (paymentTypeFilter && paymentTypeFilter !== "all") {
      filteredData = filteredData.filter((item) => item.formaPago === paymentTypeFilter)
    }

    // Aplicar filtro de empresa
    if (entityFilter && entityFilter !== "all") {
      filteredData = filteredData.filter((item) => item.entityId === entityFilter)
    }

    // Aplicar búsqueda por término
    if (searchTerm) {
      filteredData = filteredData.filter(
        (item) =>
          item.detalle.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.rubro.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.subrubro.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Actualizar el total de items para la paginación
    setTotalItems(filteredData.length)

    // Aplicar paginación
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage)

    setTransactions(paginatedData)
  }

  // Función para manejar el clic derecho
  const handleContextMenu = (e: React.MouseEvent, transaction: Transaction) => {
    e.preventDefault()
    setSelectedMovement(transaction)
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      show: true,
    })
  }

  // Función para obtener opciones de filtros
  const fetchFilterOptions = async () => {
    try {
      // Obtener categorías
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("category")
        .select("id, description")
        .order("description")

      if (categoriesError) throw categoriesError
      setCategories(categoriesData || [])

      // Obtener subcategorías
      const { data: subcategoriesData, error: subcategoriesError } = await supabase
        .from("sub_category")
        .select("id, description, category_id")
        .order("description")

      if (subcategoriesError) throw subcategoriesError
      setSubcategories(subcategoriesData || [])

      // Obtener tipos de pago únicos
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payment")
        .select("payment_type")
        .order("payment_type")

      if (paymentsError) throw paymentsError
      const uniquePaymentTypes = [...new Set(paymentsData?.map((p) => p.payment_type) || [])]
      setPaymentTypes(uniquePaymentTypes)

      // Obtener entidades
      const { data: entitiesData, error: entitiesError } = await supabase
        .from("entity")
        .select("id, nombre")
        .order("nombre")

      if (entitiesError) throw entitiesError
      setEntities(entitiesData || [])
    } catch (error) {
      console.error("Error al cargar opciones de filtros:", error)
      setError("No se pudieron cargar las opciones de filtros")
    }
  }

  // Función para obtener transacciones
  const fetchTransactions = async () => {
    setLoading(true)
    try {
      // Construir la consulta base
      let query = supabase
        .from("movements")
        .select(`
        id,
        description,
        movement_type,
        operation_id,
        sub_category_id,
        created_by,
        check,
        operations:operation_id (
          id,
          payment_id,
          bill_id,
          payments:payment_id (
            id,
            payment_type
          ),
          bills:bill_id (
            id,
            bill_number,
            bill_date,
            bill_amount,
            entity_id,
            entity:entity_id (
              id,
              nombre
            )
          )
        ),
        sub_categories:sub_category_id (
          id,
          description,
          category_id,
          categories:category_id (
            id,
            description
          )
        ),
        movement_taxes (
          id,
          tax_id,
          calculated_amount,
          taxes:tax_id (
            id,
            name,
            percentage
          )
        )
      `)
        .order("id", { ascending: false })

      // Aplicar filtro de tipo de movimiento si es necesario
      if (movementType !== "all") {
        query = query.eq("movement_type", movementType)
      } else if (movementTypeFilter && movementTypeFilter !== "all") {
        query = query.eq("movement_type", movementTypeFilter)
      }

      // Ejecutar la consulta
      const { data, error } = await query

      if (error) throw error

      // Transformar los datos para la tabla
      const formattedData: Transaction[] =
        data?.map((item) => {
          // Calcular la suma de los impuestos
          const percepcion = item.movement_taxes?.reduce((sum, tax) => sum + (tax.calculated_amount || 0), 0) || 0

          return {
            id: item.id,
            detalle: item.description || "",
            empresa: item.operations?.bills?.entity?.nombre || "",
            formaPago: item.operations?.payments?.payment_type || "",
            fechaComprobante: item.operations?.bills?.bill_date || "",
            factura: item.operations?.bills?.bill_number || "",
            movimiento: item.movement_type as "ingreso" | "egreso" | "inversión",
            rubro: item.sub_categories?.categories?.description || "",
            subrubro: item.sub_categories?.description || "",
            importe: item.operations?.bills?.bill_amount || 0,
            percepcion: percepcion,
            // Guardamos los IDs para filtrar después
            categoryId: item.sub_categories?.category_id,
            subcategoryId: item.sub_category_id,
            entityId: item.operations?.bills?.entity_id,
            check: item.check || false,
          }
        }) || []

      // Guardar todos los datos sin filtrar
      setAllTransactions(formattedData)

      // Aplicar los filtros en el lado del cliente
      // (esto se hará automáticamente por el useEffect)
    } catch (error) {
      console.error("Error al cargar transacciones:", error)
      setError("No se pudieron cargar las transacciones")
      setAllTransactions([])
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  // Función para eliminar un movimiento
  const handleDeleteMovement = async () => {
    if (!selectedMovement) return

    try {
      setIsDeleting(true)

      // 1. Obtener los datos del movimiento para conocer las relaciones
      const { data: movementData, error: movementError } = await supabase
        .from("movements")
        .select("operation_id")
        .eq("id", selectedMovement.id)
        .single()

      if (movementError) throw movementError

      // 2. Eliminar los impuestos asociados al movimiento
      const { error: taxesError } = await supabase
        .from("movement_taxes")
        .delete()
        .eq("movement_id", selectedMovement.id)

      if (taxesError) throw taxesError

      // 3. Eliminar el movimiento
      const { error: deleteError } = await supabase.from("movements").delete().eq("id", selectedMovement.id)

      if (deleteError) throw deleteError

      // 4. Obtener los datos de la operación
      const { data: operationData, error: operationError } = await supabase
        .from("operations")
        .select("payment_id, bill_id")
        .eq("id", movementData.operation_id)
        .single()

      if (operationError) throw operationError

      // 5. Eliminar la operación
      const { error: operationDeleteError } = await supabase
        .from("operations")
        .delete()
        .eq("id", movementData.operation_id)

      if (operationDeleteError) throw operationDeleteError

      // 6. Eliminar el pago y la factura
      const { error: paymentError } = await supabase.from("payment").delete().eq("id", operationData.payment_id)

      if (paymentError) throw paymentError

      const { error: billError } = await supabase.from("bills").delete().eq("id", operationData.bill_id)

      if (billError) throw billError

      // Mostrar mensaje de éxito
      toast({
        title: "Movimiento eliminado",
        description: "El movimiento ha sido eliminado correctamente",
        type: "success",
      })

      // Recargar los datos
      fetchTransactions()
    } catch (error: any) {
      console.error("Error al eliminar el movimiento:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el movimiento",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setSelectedMovement(null)
    }
  }

  // Función para resetear filtros
  const resetFilters = () => {
    if (movementType === "all") {
      setMovementTypeFilter("")
    }
    setCategoryFilter("")
    setSubcategoryFilter("")
    setPaymentTypeFilter("")
    setEntityFilter("")
    setSearchTerm("")
    setCurrentPage(1)
  }

  // Función para obtener el color según el tipo de movimiento
  const getAmountColor = (movementType: string) => {
    switch (movementType) {
      case "ingreso":
        return "text-green-600"
      case "egreso":
        return "text-red-600"
      case "inversión":
        return "text-gray-600"
      default:
        return ""
    }
  }

  // Función para formatear la fecha
  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES")
  }

  // Calcular el número total de páginas
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  // Determinar el mensaje cuando no hay resultados
  const getNoResultsMessage = () => {
    if (movementType === "ingreso") return "No se encontraron ingresos"
    if (movementType === "egreso") return "No se encontraron egresos"
    if (movementType === "inversión") return "No se encontraron inversiones"
    return "No se encontraron resultados"
  }

  return (
    <div className="space-y-6 w-full">
      {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Filtros</h3>
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Limpiar filtros
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Filtro por tipo de movimiento (solo si showMovementTypeFilter es true) */}
              {showMovementTypeFilter && movementType === "all" && (
                <div>
                  <Label htmlFor="movementType">Tipo de movimiento</Label>
                  <Select value={movementTypeFilter} onValueChange={setMovementTypeFilter}>
                    <SelectTrigger id="movementType">
                      <SelectValue placeholder="Todos los movimientos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="ingreso">Ingreso</SelectItem>
                      <SelectItem value="egreso">Egreso</SelectItem>
                      <SelectItem value="inversión">Inversión</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Filtro por rubro */}
              <div>
                <Label htmlFor="category">Rubro</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Todos los rubros" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por subrubro */}
              <div>
                <Label htmlFor="subcategory">Subrubro</Label>
                <Select value={subcategoryFilter} onValueChange={setSubcategoryFilter} disabled={!categoryFilter}>
                  <SelectTrigger id="subcategory">
                    <SelectValue placeholder="Todos los subrubros" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {subcategories
                      .filter((sub) => !categoryFilter || sub.category_id === categoryFilter)
                      .map((subcategory) => (
                        <SelectItem key={subcategory.id} value={subcategory.id}>
                          {subcategory.description}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por tipo de pago */}
              <div>
                <Label htmlFor="paymentType">Forma de pago</Label>
                <Select value={paymentTypeFilter} onValueChange={setPaymentTypeFilter}>
                  <SelectTrigger id="paymentType">
                    <SelectValue placeholder="Todas las formas de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {paymentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por empresa */}
              <div>
                <Label htmlFor="entity">Empresa</Label>
                <Select value={entityFilter} onValueChange={setEntityFilter}>
                  <SelectTrigger id="entity">
                    <SelectValue placeholder="Todas las empresas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {entities.map((entity) => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {entity.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Búsqueda por nombre */}
              <div>
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Buscar por detalle, empresa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Opciones de tabla y botón de agregar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        {/* Selector de columnas visibles */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Vista
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Columnas visibles</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ScrollArea className="h-80">
              {ALL_COLUMNS.filter((column) => movementType === "all" || column.id !== "movimiento").map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={visibleColumns.includes(column.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setVisibleColumns([...visibleColumns, column.id])
                    } else {
                      setVisibleColumns(visibleColumns.filter((id) => id !== column.id))
                    }
                  }}
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Botón para agregar nuevo movimiento */}
        <Button variant="default" className="bg-green-700 hover:bg-green-600" onClick={() => setIsDialogOpen(true)}>
          Ingresar datos
        </Button>
      </div>

      {/* Tabla de transacciones */}
      <div className="w-full overflow-auto rounded-md border bg-white">
        <div className="min-w-max">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                {visibleColumns.includes("check") && (
                  <th className="h-10 px-4 text-center align-middle font-medium whitespace-nowrap">VERIFICADO</th>
                )}
                {visibleColumns.includes("detalle") && (
                  <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap">DETALLE</th>
                )}
                {visibleColumns.includes("empresa") && (
                  <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap">EMPRESA</th>
                )}
                {visibleColumns.includes("formaPago") && (
                  <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap">FORMA DE PAGO</th>
                )}
                {visibleColumns.includes("fechaComprobante") && (
                  <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap">FECHA COMPROBANTE</th>
                )}
                {visibleColumns.includes("factura") && (
                  <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap">FACTURA</th>
                )}
                {visibleColumns.includes("movimiento") && (
                  <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap">MOVIMIENTO</th>
                )}
                {visibleColumns.includes("rubro") && (
                  <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap">RUBRO</th>
                )}
                {visibleColumns.includes("subrubro") && (
                  <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap">SUBRUBRO</th>
                )}
                {visibleColumns.includes("importe") && (
                  <th className="h-10 px-4 text-right align-middle font-medium whitespace-nowrap">IMPORTE</th>
                )}
                {visibleColumns.includes("percepcion") && (
                  <th className="h-10 px-4 text-right align-middle font-medium whitespace-nowrap">PERCEPCIÓN</th>
                )}
                {visibleColumns.includes("importeFinal") && (
                  <th className="h-10 px-4 text-right align-middle font-medium whitespace-nowrap">IMPORTE FINAL</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="p-4 text-center">
                    Cargando datos...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="p-4 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="p-6 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p className="text-lg font-medium text-muted-foreground">{getNoResultsMessage()}</p>
                      {(categoryFilter ||
                        subcategoryFilter ||
                        paymentTypeFilter ||
                        entityFilter ||
                        searchTerm ||
                        movementTypeFilter) && (
                        <p className="text-sm text-muted-foreground">
                          Prueba a cambiar o eliminar algunos filtros para ver más resultados
                        </p>
                      )}
                      <Button variant="outline" size="sm" onClick={resetFilters} className="mt-2">
                        Limpiar filtros
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b hover:bg-muted/50 cursor-context-menu"
                    onContextMenu={(e) => handleContextMenu(e, transaction)}
                  >
                    {visibleColumns.includes("check") && (
                      <td className="p-4 text-center">
                        <Checkbox
                          checked={transaction.check}
                          onCheckedChange={async (checked) => {
                            try {
                              const { error } = await supabase
                                .from("movements")
                                .update({ check: checked })
                                .eq("id", transaction.id)
                              
                              if (error) throw error
                              
                              // Actualizar el estado local
                              setTransactions((prev) =>
                                prev.map((t) =>
                                  t.id === transaction.id ? { ...t, check: checked as boolean } : t
                                )
                              )
                              
                              // Actualizar también en allTransactions
                              setAllTransactions((prev) =>
                                prev.map((t) =>
                                  t.id === transaction.id ? { ...t, check: checked as boolean } : t
                                )
                              )
                            } catch (error) {
                              console.error("Error al actualizar el estado del check:", error)
                              toast({
                                title: "Error",
                                description: "No se pudo actualizar el estado de verificación",
                                variant: "destructive",
                              })
                            }
                          }}
                        />
                      </td>
                    )}
                    {visibleColumns.includes("detalle") && <td className="p-4 truncate">{transaction.detalle}</td>}
                    {visibleColumns.includes("empresa") && <td className="p-4 truncate">{transaction.empresa}</td>}
                    {visibleColumns.includes("formaPago") && <td className="p-4 truncate">{transaction.formaPago}</td>}
                    {visibleColumns.includes("fechaComprobante") && (
                      <td className="p-4 truncate">{formatDate(transaction.fechaComprobante)}</td>
                    )}
                    {visibleColumns.includes("factura") && <td className="p-4 truncate">{transaction.factura}</td>}
                    {visibleColumns.includes("movimiento") && (
                      <td className="p-4 truncate capitalize">{transaction.movimiento}</td>
                    )}
                    {visibleColumns.includes("rubro") && <td className="p-4 truncate">{transaction.rubro}</td>}
                    {visibleColumns.includes("subrubro") && <td className="p-4 truncate">{transaction.subrubro}</td>}
                    {visibleColumns.includes("importe") && (
                      <td className={`p-4 text-right truncate ${getAmountColor(transaction.movimiento)}`}>
                        {formatCurrency(transaction.importe)}
                      </td>
                    )}
                    {visibleColumns.includes("percepcion") && (
                      <td className="p-4 text-right truncate">{formatCurrency(transaction.percepcion)}</td>
                    )}
                    {visibleColumns.includes("importeFinal") && (
                      <td className={`p-4 text-right truncate ${getAmountColor(transaction.movimiento)}`}>
                        {formatCurrency(
                          transaction.movimiento === "ingreso"
                            ? transaction.importe - transaction.percepcion
                            : transaction.importe + transaction.percepcion,
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {transactions.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
          {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages || totalItems === 0}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Menú contextual personalizado */}
      {contextMenu && contextMenu.show && (
        <div
          className="fixed z-50 bg-white shadow-md rounded-md overflow-hidden"
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
          }}
        >
          <div className="py-1">
            <button
              onClick={() => {
                setIsEditDialogOpen(true)
                setContextMenu(null)
              }}
              className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-muted"
            >
              <Edit className="h-4 w-4" />
              Editar
            </button>
            <div className="border-t my-1"></div>
            <button
              onClick={() => {
                setIsDeleteDialogOpen(true)
                setContextMenu(null)
              }}
              className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-muted"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </button>
          </div>
        </div>
      )}

      {/* Formulario para agregar/editar movimientos */}
      <MovementForm
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            // Recargar datos cuando se cierra el formulario
            fetchTransactions()
          }
        }}
        defaultMovementType={movementType !== "all" ? movementType : undefined}
      />

      {/* Formulario para editar movimiento */}
      <MovementForm
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        isEditMode={true}
        existingData={selectedMovement}
        onSuccess={fetchTransactions}
      />

      {/* Diálogo de confirmación para eliminar */}
      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteMovement}
        title="Eliminar movimiento"
        description="¿Está seguro de que desea eliminar este movimiento? Esta acción no se puede deshacer."
        isDeleting={isDeleting}
      />
    </div>
  )
}
