export interface TaxFormData {
  name: string
  percentage: number
  hasPercentage?: boolean
}

export interface MovementFormData {
  description: string
  movementType: "ingreso" | "egreso" | "inversión"
  paymentType: string
  customPaymentType: string
  amount: number
  category: number | string // ID de la categoría (number) o string vacío
  subCategory: number | string // ID de la subcategoría (number) o string vacío
  categoryText: string // Texto libre para categoría
  subCategoryText: string // Texto libre para subcategoría
  billNumber: string
  billDate: string
  entityName: string
  entityId: string // ID de la entidad
  entityCuitCuil: string // CUIT/CUIL de la entidad
  selectedTaxes: Tax[]
  // Nuevos campos para pagos de impuestos
  isTaxPayment: boolean
  relatedTaxId: number | null // Cambiado de string a number para coincidir con BIGINT
  check: boolean
}

export interface Tax {
  id: string
  name: string
  percentage: number | null
}

