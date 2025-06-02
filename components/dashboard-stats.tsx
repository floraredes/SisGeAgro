"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDown, DollarSign, Receipt, TrendingDown, TrendingUp } from "lucide-react"
import { supabase } from "@/lib/supabase/supabaseClient"
// Importar el hook de moneda
import { useCurrency } from "@/contexts/currency-context"


// Cambiar la interfaz de props
interface DashboardStatsProps {
  startDate: string
  endDate: string
}

export function DashboardStats({ startDate, endDate }: DashboardStatsProps) {
  // Usar el hook de moneda para formatear valores
  const { formatCurrency } = useCurrency()

  const [loading, setLoading] = useState(true)
  const [movements, setMovements] = useState<any[]>([])
  const [stats, setStats] = useState({
    income: 0,
    expense: 0,
    taxes: 0,
  })

  useEffect(() => {
    async function fetchMovements() {
      setLoading(true)
      try {
        // Traer todos los movimientos del año en curso
        const year = new Date().getFullYear()
        const yearStart = `${year}-01-01`
        const yearEnd = `${year}-12-31`
        const { data, error } = await supabase
          .from("movements")
          .select(`
            movement_type,
            operations:operation_id (
              bills:bill_id (
                bill_amount,
                bill_date
              )
            ),
            movement_taxes (
              calculated_amount
            )
          `)
          .gte("operations.bills.bill_date", yearStart)
          .lte("operations.bills.bill_date", yearEnd)
        if (error) throw error
        setMovements(data || [])
      } catch (error) {
        console.error("Error fetching movements:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchMovements()
  }, [])

  useEffect(() => {
    // Unificar el cálculo de totales según el rango de fechas seleccionado
    function calculateTotals(movements: any[], start: string, end: string) {
      let income = 0
      let expense = 0
      let taxes = 0
      movements.forEach((movement) => {
        // Iterar sobre operaciones y bills
        let bills: any[] = []
        if (Array.isArray(movement.operations)) {
          movement.operations.forEach((op: any) => {
            if (Array.isArray(op.bills)) {
              bills = bills.concat(op.bills)
            }
          })
        } else if ((movement.operations as any)?.bills) {
          bills = Array.isArray((movement.operations as any).bills) ? (movement.operations as any).bills : [(movement.operations as any).bills]
        }
        // Tomar el primer bill válido dentro del rango
        const bill = bills.find(b => b.bill_date && b.bill_date >= start && b.bill_date <= end)
        if (!bill) return
        const amount = bill.bill_amount || 0
        const taxesAmount = movement.movement_taxes?.reduce((sum: any, tax: any) => sum + (tax.calculated_amount || 0), 0) || 0
        if (movement.movement_type === "ingreso") {
          income += amount
          taxes += taxesAmount
        } else if (movement.movement_type === "egreso") {
          expense += amount
          taxes += taxesAmount
        }
      })
      return { income, expense, taxes }
    }
    if (startDate && endDate) {
      setStats(calculateTotals(movements, startDate, endDate))
    }
  }, [movements, startDate, endDate])

  // Función para calcular el porcentaje de cambio
  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  // Obtener los datos según el período seleccionado
  const currentData = {
    income: stats.income,
    expense: stats.expense,
    taxes: stats.taxes,
  }

  // Calcular porcentajes de cambio
  const incomePercentageChange = calculatePercentageChange(currentData.income, 0)
  const expensePercentageChange = calculatePercentageChange(currentData.expense, 0)
  const taxesPercentageChange = calculatePercentageChange(currentData.taxes, 0)

  // Función para obtener el nombre del mes
  const getMonthName = (offset = 0) => {
    const date = new Date()
    date.setMonth(date.getMonth() - offset)
    return date.toLocaleString("es-ES", { month: "long" })
  }

  // Obtener el nombre del mes según el período seleccionado
  const currentMonthName = getMonthName()

  // Calcular el balance
  const balance = currentData.income - currentData.expense

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Card de Ingresos Totales */}
      <Card className="shadow-lg border-none">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Ingresos</CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse h-8 bg-gray-200 rounded"></div>
          ) : (
            <>
              <div className="text-2xl font-bold text-gray-800">{formatCurrency(currentData.income)}</div>
              <p className="text-xs text-muted-foreground">
                {currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1)}
              </p>
              <div className="flex items-center pt-1">
                {incomePercentageChange > 0 ? (
                  <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
                )}
                <span
                  className={`text-xs ${
                    incomePercentageChange > 0 ? "text-green-600" : incomePercentageChange < 0 ? "text-red-600" : ""
                  }`}
                >
                  {incomePercentageChange.toFixed(1)}%
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Card de Egresos Totales */}
      <Card className="shadow-lg border-none">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Egresos</CardTitle>
          <ArrowDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse h-8 bg-gray-200 rounded"></div>
          ) : (
            <>
              <div className="text-2xl font-bold text-gray-800">{formatCurrency(currentData.expense)}</div>
              <p className="text-xs text-muted-foreground">
                {currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1)}
              </p>
              <div className="flex items-center pt-1">
                {/* Para egresos, un aumento es negativo y una disminución es positiva */}
                {expensePercentageChange < 0 ? (
                  <TrendingDown className="mr-1 h-3 w-3 text-green-600" />
                ) : (
                  <TrendingUp className="mr-1 h-3 w-3 text-red-600" />
                )}
                <span
                  className={`text-xs ${
                    expensePercentageChange < 0 ? "text-green-600" : expensePercentageChange > 0 ? "text-red-600" : ""
                  }`}
                >
                  {expensePercentageChange.toFixed(1)}%
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Card de Impuestos Totales */}
      <Card className="shadow-lg border-none">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Impuestos</CardTitle>
          <Receipt className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse h-8 bg-gray-200 rounded"></div>
          ) : (
            <>
              <div className="text-2xl font-bold text-gray-800">{formatCurrency(currentData.taxes)}</div>
              <p className="text-xs text-muted-foreground">
                {currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1)}
              </p>
              <div className="flex items-center pt-1">
                {/* Para impuestos, un aumento es negativo y una disminución es positiva */}
                {taxesPercentageChange < 0 ? (
                  <TrendingDown className="mr-1 h-3 w-3 text-green-600" />
                ) : (
                  <TrendingUp className="mr-1 h-3 w-3 text-red-600" />
                )}
                <span
                  className={`text-xs ${
                    taxesPercentageChange < 0 ? "text-green-600" : taxesPercentageChange > 0 ? "text-red-600" : ""
                  }`}
                >
                  {taxesPercentageChange.toFixed(1)}%
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Card de Balance */}
      <Card className="shadow-lg border-none">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Balance</CardTitle>
          <DollarSign className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse h-8 bg-gray-200 rounded"></div>
          ) : (
            <>
              <div className="text-2xl font-bold text-gray-800">{formatCurrency(balance)}</div>
              <p className="text-xs text-muted-foreground">
                {currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1)}
              </p>
              <div className="flex items-center pt-1">
                <span className="text-xs text-muted-foreground">Ingresos - Egresos</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
