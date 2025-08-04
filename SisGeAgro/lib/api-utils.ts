// Utilidades para llamar a las API routes que manejan la autenticación y acceso a datos

// Función para obtener estadísticas del dashboard
export async function getDashboardStats(startDate: string, endDate: string) {
  console.log(`getDashboardStats: Iniciando - startDate: ${startDate}, endDate: ${endDate}`)
  try {
    const response = await fetch('/api/movements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate,
        endDate,
        includeStats: true
      }),
    })

    console.log(`getDashboardStats: Status de respuesta: ${response.status}`)
    
    if (!response.ok) {
      throw new Error(`Error al obtener estadísticas: ${response.status}`)
    }

    const data = await response.json()
    console.log(`getDashboardStats: Respuesta de API - ${data.movements?.length || 0} movimientos`)
    console.log(`getDashboardStats: Datos completos:`, data)
    return data.movements || []
  } catch (error) {
    console.error('Error en getDashboardStats:', error)
    return []
  }
}

// Función para obtener movimientos
export async function getMovements(filters?: {
  movementType?: string
  startDate?: string
  endDate?: string
  categoryId?: string
  subcategoryId?: string
  entityId?: string
  paymentType?: string
}) {
  try {
    const response = await fetch('/api/movements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...filters,
        includeStats: false
      }),
    })

    if (!response.ok) {
      throw new Error(`Error al obtener movimientos: ${response.status}`)
    }

    const data = await response.json()
    return data.movements || []
  } catch (error) {
    console.error('Error en getMovements:', error)
    return []
  }
}

// Función para obtener categorías
export async function getCategories() {
  try {
    const response = await fetch('/api/categories')
    
    if (!response.ok) {
      throw new Error(`Error al obtener categorías: ${response.status}`)
    }

    const data = await response.json()
    return data.categories || []
  } catch (error) {
    console.error('Error en getCategories:', error)
    return []
  }
}

// Función para obtener subcategorías
export async function getSubcategories() {
  try {
    const response = await fetch('/api/subcategories')
    
    if (!response.ok) {
      throw new Error(`Error al obtener subcategorías: ${response.status}`)
    }

    const data = await response.json()
    return data.subcategories || []
  } catch (error) {
    console.error('Error en getSubcategories:', error)
    return []
  }
}

// Función para obtener entidades
export async function getEntities() {
  try {
    const response = await fetch('/api/entities')
    
    if (!response.ok) {
      throw new Error(`Error al obtener entidades: ${response.status}`)
    }

    const data = await response.json()
    return data.entities || []
  } catch (error) {
    console.error('Error en getEntities:', error)
    return []
  }
}

// Función para obtener tipos de pago
export async function getPaymentTypes() {
  try {
    const response = await fetch('/api/payment-types')
    
    if (!response.ok) {
      throw new Error(`Error al obtener tipos de pago: ${response.status}`)
    }

    const data = await response.json()
    return data.paymentTypes || []
  } catch (error) {
    console.error('Error en getPaymentTypes:', error)
    return []
  }
} 

// Función para obtener ingresos (movimientos de tipo ingreso)
export async function getIncomes(startDate: string, endDate: string) {
  try {
    const response = await fetch('/api/movements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate,
        endDate,
        movementType: 'ingreso',
        includeStats: false
      }),
    })

    if (!response.ok) {
      throw new Error(`Error al obtener ingresos: ${response.status}`)
    }
    const data = await response.json()
    return data.movements || []
  } catch (error) {
    console.error('Error en getIncomes:', error)
    return []
  }
} 

// Función para obtener egresos (movimientos de tipo egreso)
export async function getExpenses(startDate: string, endDate: string) {
  try {
    const response = await fetch('/api/movements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate,
        endDate,
        movementType: 'egreso',
        includeStats: false
      }),
    })

    if (!response.ok) {
      throw new Error(`Error al obtener egresos: ${response.status}`)
    }
    const data = await response.json()
    return data.movements || []
  } catch (error) {
    console.error('Error en getExpenses:', error)
    return []
  }
} 