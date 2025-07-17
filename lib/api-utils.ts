// Utilidades para llamar a las API routes desde el frontend

// Función para obtener movimientos
export async function getMovements(movementType: string = "all") {
  try {
    const params = new URLSearchParams()
    if (movementType !== "all") {
      params.append("movementType", movementType)
    }

    const response = await fetch(`/api/movements?${params.toString()}`)
    if (!response.ok) {
      throw new Error("Error al obtener movimientos")
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error("Error getting movements:", error)
    throw error
  }
}

// Función para obtener estadísticas del dashboard
export async function getDashboardStats(startDate: string, endDate: string) {
  try {
    const params = new URLSearchParams({
      startDate,
      endDate
    })

    const response = await fetch(`/api/dashboard-stats?${params.toString()}`)
    if (!response.ok) {
      throw new Error("Error al obtener estadísticas")
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error("Error getting dashboard stats:", error)
    throw error
  }
}

// Función para obtener categorías
export async function getCategories() {
  try {
    const response = await fetch("/api/categories")
    if (!response.ok) {
      throw new Error("Error al obtener categorías")
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error("Error getting categories:", error)
    throw error
  }
}

// Función para obtener subcategorías
export async function getSubcategories() {
  try {
    const response = await fetch("/api/subcategories")
    if (!response.ok) {
      throw new Error("Error al obtener subcategorías")
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error("Error getting subcategories:", error)
    throw error
  }
}

// Función para obtener entidades
export async function getEntities() {
  try {
    const response = await fetch("/api/entities")
    if (!response.ok) {
      throw new Error("Error al obtener entidades")
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error("Error getting entities:", error)
    throw error
  }
}

// Función para obtener tipos de pago
export async function getPaymentTypes() {
  try {
    const response = await fetch("/api/payment-types")
    if (!response.ok) {
      throw new Error("Error al obtener tipos de pago")
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error("Error getting payment types:", error)
    throw error
  }
} 