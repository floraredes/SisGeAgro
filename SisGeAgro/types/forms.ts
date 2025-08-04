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
  category: string
  subCategory: string
  categoryText: string // Texto libre para categoría
  subCategoryText: string // Texto libre para subcategoría
  billNumber: string
  billDate: string
  entityName: string
  entityId: string // CUIT/CUIL de la entidad
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

