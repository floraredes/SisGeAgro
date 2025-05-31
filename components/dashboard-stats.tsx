"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDown, DollarSign, Receipt, TrendingDown, TrendingUp } from "lucide-react"
import { supabase } from "@/lib/supabase/supabaseClient"
// Importar el hook de moneda
import { useCurrency } from "@/contexts/currency-context"

// Función para obtener el primer y último día del mes
function getMonthDates(year: number, month: number) {
  const startDate = `${year}-${month.toString().padStart(2, "0")}-01`
  const endDate = `${year}-${month.toString().padStart(2, "0")}-${new Date(year, month, 0).getDate()}`
  return { startDate, endDate }
}

// Añadir props al componente
interface DashboardStatsProps {
  period: "current" | "previous"
  onPeriodChange?: (period: "current" | "previous") => void
}

export function DashboardStats({ period, onPeriodChange }: DashboardStatsProps) {
  // Usar el hook de moneda para formatear valores
  const { formatCurrency } = useCurrency()

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    currentMonth: {
      income: 0,
      expense: 0,
      taxes: 0,
    },
    previousMonth: {
      income: 0,
      expense: 0,
      taxes: 0,
    },
    twoMonthsAgo: {
      income: 0,
      expense: 0,
      taxes: 0,
    },
  })

  useEffect(() => {
    async function fetchStatsData() {
      setLoading(true)
      try {
        const today = new Date()
        const currentYear = today.getFullYear()
        const currentMonth = today.getMonth() + 1 // JavaScript months are 0-indexed

        // Fechas para el mes actual
        const { startDate: currentStartDate, endDate: currentEndDate } = getMonthDates(currentYear, currentMonth)

        // Fechas para el mes anterior
        const previousDate = new Date(today)
        previousDate.setMonth(today.getMonth() - 1)
        const previousYear = previousDate.getFullYear()
        const previousMonth = previousDate.getMonth() + 1
        const { startDate: previousStartDate, endDate: previousEndDate } = getMonthDates(previousYear, previousMonth)

        // Fechas para dos meses atrás
        const twoMonthsAgoDate = new Date(today)
        twoMonthsAgoDate.setMonth(today.getMonth() - 2)
        const twoMonthsAgoYear = twoMonthsAgoDate.getFullYear()
        const twoMonthsAgoMonth = twoMonthsAgoDate.getMonth() + 1
        const { startDate: twoMonthsAgoStartDate, endDate: twoMonthsAgoEndDate } = getMonthDates(
          twoMonthsAgoYear,
          twoMonthsAgoMonth,
        )

        // Obtener ingresos y egresos para el mes actual
        const { data: currentData, error: currentError } = await supabase
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
          .gte("operations.bills.bill_date", currentStartDate)
          .lte("operations.bills.bill_date", currentEndDate)

        if (currentError) throw currentError

        // Obtener ingresos y egresos para el mes anterior
        const { data: previousData, error: previousError } = await supabase
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
          .gte("operations.bills.bill_date", previousStartDate)
          .lte("operations.bills.bill_date", previousEndDate)

        if (previousError) throw previousError

        // Obtener ingresos y egresos para dos meses atrás
        const { data: twoMonthsAgoData, error: twoMonthsAgoError } = await supabase
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
          .gte("operations.bills.bill_date", twoMonthsAgoStartDate)
          .lte("operations.bills.bill_date", twoMonthsAgoEndDate)

        if (twoMonthsAgoError) throw twoMonthsAgoError

        // Calcular totales para el mes actual
        let currentIncome = 0
        let currentExpense = 0
        let currentTaxes = 0

        currentData?.forEach((movement) => {
          const amount = movement.operations?.bills?.bill_amount || 0
          const taxes = movement.movement_taxes?.reduce((sum, tax) => sum + (tax.calculated_amount || 0), 0) || 0

          if (movement.movement_type === "ingreso") {
            currentIncome += amount
            // Para ingresos, los impuestos se restan
            currentTaxes += taxes
          } else if (movement.movement_type === "egreso") {
            currentExpense += amount
            // Para egresos, los impuestos se suman
            currentTaxes += taxes
          }
        })

        // Calcular totales para el mes anterior
        let previousIncome = 0
        let previousExpense = 0
        let previousTaxes = 0

        previousData?.forEach((movement) => {
          const amount = movement.operations?.bills?.bill_amount || 0
          const taxes = movement.movement_taxes?.reduce((sum, tax) => sum + (tax.calculated_amount || 0), 0) || 0

          if (movement.movement_type === "ingreso") {
            previousIncome += amount
            previousTaxes += taxes
          } else if (movement.movement_type === "egreso") {
            previousExpense += amount
            previousTaxes += taxes
          }
        })

        // Calcular totales para dos meses atrás
        let twoMonthsAgoIncome = 0
        let twoMonthsAgoExpense = 0
        let twoMonthsAgoTaxes = 0

        twoMonthsAgoData?.forEach((movement) => {
          const amount = movement.operations?.bills?.bill_amount || 0
          const taxes = movement.movement_taxes?.reduce((sum, tax) => sum + (tax.calculated_amount || 0), 0) || 0

          if (movement.movement_type === "ingreso") {
            twoMonthsAgoIncome += amount
            twoMonthsAgoTaxes += taxes
          } else if (movement.movement_type === "egreso") {
            twoMonthsAgoExpense += amount
            twoMonthsAgoTaxes += taxes
          }
        })

        setStats({
          currentMonth: {
            income: currentIncome,
            expense: currentExpense,
            taxes: currentTaxes,
          },
          previousMonth: {
            income: previousIncome,
            expense: previousExpense,
            taxes: previousTaxes,
          },
          twoMonthsAgo: {
            income: twoMonthsAgoIncome,
            expense: twoMonthsAgoExpense,
            taxes: twoMonthsAgoTaxes,
          },
        })
      } catch (error) {
        console.error("Error fetching stats data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStatsData()
  }, [])

  // Función para calcular el porcentaje de cambio
  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  // Obtener los datos según el período seleccionado
  const currentData = period === "current" ? stats.currentMonth : stats.previousMonth
  const previousData = period === "current" ? stats.previousMonth : stats.twoMonthsAgo

  // Calcular porcentajes de cambio
  const incomePercentageChange = calculatePercentageChange(currentData.income, previousData.income)
  const expensePercentageChange = calculatePercentageChange(currentData.expense, previousData.expense)
  const taxesPercentageChange = calculatePercentageChange(currentData.taxes, previousData.taxes)

  // Función para obtener el nombre del mes
  const getMonthName = (offset = 0) => {
    const date = new Date()
    date.setMonth(date.getMonth() - offset)
    return date.toLocaleString("es-ES", { month: "long" })
  }

  // Obtener el nombre del mes según el período seleccionado
  const currentMonthName = period === "current" ? getMonthName() : getMonthName(1)
  const previousMonthName = period === "current" ? getMonthName(1) : getMonthName(2)

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
                <span className="text-xs text-muted-foreground ml-1">
                  vs. {previousMonthName.charAt(0).toUpperCase() + previousMonthName.slice(1)}
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
                <span className="text-xs text-muted-foreground ml-1">
                  vs. {previousMonthName.charAt(0).toUpperCase() + previousMonthName.slice(1)}
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
                <span className="text-xs text-muted-foreground ml-1">
                  vs. {previousMonthName.charAt(0).toUpperCase() + previousMonthName.slice(1)}
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
