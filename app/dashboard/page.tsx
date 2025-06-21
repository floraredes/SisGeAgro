"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { DashboardStats } from "@/components/dashboard-stats"
import { supabase } from "@/lib/supabase/supabaseClient"
import { ArrowLeftRight, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCurrency } from "@/contexts/currency-context"
import { Input } from "@/components/ui/input"


function getLocalDateString(date: Date) {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseLocalDate(str: string) {
  // str: 'YYYY-MM-DD'
  const [year, month, day] = str.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function getMonthRangeString(startDate: string, endDate: string) {
  const [startYear, startMonth] = startDate.split('-')
  const [endYear, endMonth] = endDate.split('-')
  const startDateObj = new Date(Number(startYear), Number(startMonth) - 1, 1)
  const endDateObj = new Date(Number(endYear), Number(endMonth) - 1, 1)
  const startMonthName = startDateObj.toLocaleString('es-ES', { month: 'long' })
  const endMonthName = endDateObj.toLocaleString('es-ES', { month: 'long' })
  if (startMonthName === endMonthName) {
    return startMonthName.charAt(0).toUpperCase() + startMonthName.slice(1)
  }
  return `${startMonthName.charAt(0).toUpperCase() + startMonthName.slice(1)} - ${endMonthName}`
}

// Reemplazar la función export default con la siguiente implementación
export default function DashboardPage() {
  // Calcular fechas por defecto
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  // Leer de localStorage o usar por defecto
  const [startDate, setStartDate] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("dashboardStartDate") || getLocalDateString(firstDay)
    }
    return getLocalDateString(firstDay)
  })
  const [endDate, setEndDate] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("dashboardEndDate") || getLocalDateString(lastDay)
    }
    return getLocalDateString(lastDay)
  })

  // Guardar en localStorage cuando cambian
  useEffect(() => {
    if (startDate) localStorage.setItem("dashboardStartDate", startDate)
  }, [startDate])
  useEffect(() => {
    if (endDate) localStorage.setItem("dashboardEndDate", endDate)
  }, [endDate])

  // Estado para todos los movimientos del año
  const [movements, setMovements] = useState<any[]>([])
  const [loadingMovements, setLoadingMovements] = useState(true)

  // Al cargar, traer todos los movimientos del año
  useEffect(() => {
    async function fetchMovements() {
      setLoadingMovements(true)
      try {
        const year = new Date().getFullYear()
        const yearStart = `${year}-01-01`
        const yearEnd = `${year}-12-31`
        const { data, error } = await supabase
          .from("movements")
          .select(`
            movement_type,
            description,
            sub_category_id,
            operations:operation_id (
              bills:bill_id (
                bill_amount,
                bill_date
              )
            ),
            movement_taxes (
              calculated_amount
            ),
            sub_categories:sub_category_id (
              categories:category_id (
                description
              )
            )
          `)
          .gte("operations.bills.bill_date", yearStart)
          .lte("operations.bills.bill_date", yearEnd)
        if (error) throw error
        setMovements(data || [])
      } catch (error) {
        console.error("Error fetching movements:", error)
      } finally {
        setLoadingMovements(false)
      }
    }
    fetchMovements()
  }, [])

  // Función para filtrar movimientos por rango de fechas
  function filterMovementsByDate(movs: any[], start: string, end: string) {
    return movs.filter((movement) => {
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
      // Al menos un bill en rango
      return bills.some(b => b.bill_date && b.bill_date >= start && b.bill_date <= end)
    })
  }

  // Función para obtener el bill principal de un movimiento en el rango
  function getBillInRange(movement: any, start: string, end: string) {
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
    return bills.find(b => b.bill_date && b.bill_date >= start && b.bill_date <= end)
  }

  // Función para calcular totales para las cards
  function calculateTotals(movs: any[], start: string, end: string) {
    let income = 0
    let expense = 0
    let taxes = 0
    movs.forEach((movement) => {
      const bill = getBillInRange(movement, start, end)
      if (!bill) return
      const amount = bill.bill_amount || 0
      const taxesAmount = movement.movement_taxes?.reduce((sum: any, tax: any) => sum + (tax.calculated_amount || 0), 0) || 0
      if (movement.movement_type === "ingreso") {
        income += amount
        taxes -= taxesAmount
      } else if (movement.movement_type === "egreso") {
        expense += amount
        taxes += taxesAmount
      }
    })
    return { income, expense, taxes }
  }

  // Función para datos de gráficos acumulados por día
  function getCumulativeData(movs: any[], start: string, end: string) {
    const startD = parseLocalDate(start)
    const endD = parseLocalDate(end)
    const days: string[] = []
    let d = new Date(startD)
    while (d <= endD) {
      days.push(getLocalDateString(d))
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
    }
    const dailyTotals: Record<string, { day: string; ingresos: number; egresos: number }> = {}
    days.forEach(day => {
      dailyTotals[day] = { day, ingresos: 0, egresos: 0 }
    })
    filterMovementsByDate(movs, start, end).forEach((movement) => {
      const bill = getBillInRange(movement, start, end)
      if (!bill) return
      const day = bill.bill_date
      const amount = bill.bill_amount || 0
      if (movement.movement_type === "ingreso") {
        dailyTotals[day].ingresos += amount
      } else if (movement.movement_type === "egreso") {
        dailyTotals[day].egresos += amount
      }
    })
    let cumulativeIngresos = 0
    let cumulativeEgresos = 0
    return days.map(day => {
      cumulativeIngresos += dailyTotals[day].ingresos
      cumulativeEgresos += dailyTotals[day].egresos
      return {
        day,
        ingresos: cumulativeIngresos,
        egresos: cumulativeEgresos,
        balance: cumulativeIngresos - cumulativeEgresos,
      }
    })
  }

  // Función para categorías de egresos
  function getExpensesByCategory(movs: any[], start: string, end: string) {
    const categoryTotals: Record<string, number> = {}
    filterMovementsByDate(movs, start, end).forEach((movement) => {
      if (movement.movement_type !== "egreso") return
      const bill = getBillInRange(movement, start, end)
      if (!bill) return
      const categoryName = movement.sub_categories?.categories?.description || "Sin categoría"
      const amount = bill.bill_amount || 0
      if (!categoryTotals[categoryName]) categoryTotals[categoryName] = 0
      categoryTotals[categoryName] += amount
    })
    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }

  // Función para categorías de ingresos
  function getIncomesByCategory(movs: any[], start: string, end: string) {
    const categoryTotals: Record<string, number> = {}
    filterMovementsByDate(movs, start, end).forEach((movement) => {
      if (movement.movement_type !== "ingreso") return
      const bill = getBillInRange(movement, start, end)
      if (!bill) return
      const categoryName = movement.sub_categories?.categories?.description || "Sin categoría"
      const amount = bill.bill_amount || 0
      if (!categoryTotals[categoryName]) categoryTotals[categoryName] = 0
      categoryTotals[categoryName] += amount
    })
    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }

  // Función para top ingresos
  function getTopIncomes(movs: any[], start: string, end: string) {
    return filterMovementsByDate(movs, start, end)
      .filter(m => m.movement_type === "ingreso")
      .map(m => {
        const bill = getBillInRange(m, start, end)
        return {
          id: m.id,
          description: m.description,
          amount: bill?.bill_amount || 0,
        }
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
  }

  // Función para top egresos
  function getTopExpenses(movs: any[], start: string, end: string) {
    return filterMovementsByDate(movs, start, end)
      .filter(m => m.movement_type === "egreso")
      .map(m => {
        const bill = getBillInRange(m, start, end)
        return {
          id: m.id,
          description: m.description,
          amount: bill?.bill_amount || 0,
        }
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
  }

  // Función para comparativa mensual (últimos 12 meses dentro del año)
  function getMonthlyMovements(movs: any[], start: string, end: string) {
    const startD = parseLocalDate(start)
    const endD = parseLocalDate(end)
    const months: string[] = []
    let d = new Date(startD.getFullYear(), startD.getMonth(), 1)
    while (d <= endD) {
      months.push(`${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`)
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    }
    const monthlyTotals: Record<string, { month: string; ingresos: number; egresos: number; balance: number }> = {}
    months.forEach(monthKey => {
      const date = parseLocalDate(monthKey + "-01")
      const monthName = date.toLocaleString("es-ES", { month: "short" })
      monthlyTotals[monthKey] = { month: monthName, ingresos: 0, egresos: 0, balance: 0 }
    })
    filterMovementsByDate(movs, start, end).forEach((movement) => {
      const bill = getBillInRange(movement, start, end)
      if (!bill) return
      const [year, month] = bill.bill_date.split("-")
      const monthKey = `${year}-${month}`
      if (monthlyTotals[monthKey]) {
        const amount = bill.bill_amount || 0
        if (movement.movement_type === "ingreso") {
          monthlyTotals[monthKey].ingresos += amount
        } else if (movement.movement_type === "egreso") {
          monthlyTotals[monthKey].egresos += amount
        }
      }
    })
    Object.keys(monthlyTotals).forEach(key => {
      monthlyTotals[key].balance = monthlyTotals[key].ingresos - monthlyTotals[key].egresos
    })
    return Object.entries(monthlyTotals)
      .map(([key, data]) => ({ monthKey: key, ...data }))
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
  }

  // Calcular todos los datos según el rango
  const filteredMovements = filterMovementsByDate(movements, startDate, endDate)
  const stats = calculateTotals(movements, startDate, endDate)
  const cumulativeData = getCumulativeData(movements, startDate, endDate)
  const expenseCategories = getExpensesByCategory(movements, startDate, endDate)
  const incomeCategories = getIncomesByCategory(movements, startDate, endDate)
  const topIncomes = getTopIncomes(movements, startDate, endDate)
  const topExpenses = getTopExpenses(movements, startDate, endDate)
  const monthlyData = getMonthlyMovements(movements, startDate, endDate)

  const { formatCurrency, currency, convertAmount } = useCurrency()

  // Colores para los gráficos de torta
  const EXPENSE_COLORS = ["#4F7942", "#6B9362", "#8FB283", "#A6C29F", "#C1D2BC"]
  const INCOME_COLORS = ["#2D5016", "#4F7942", "#6B9362", "#8FB283", "#A6C29F"]

  // Función para alternar entre ingresos y egresos
  const [showIncomes, setShowIncomes] = useState(true)
  const toggleMovementType = () => {
    setShowIncomes((prev) => !prev)
  }

  // Función para formatear los valores del eje Y según la moneda seleccionada
  const formatYAxisTick = (value: number) => {
    const convertedValue = convertAmount(value, "ARS", currency)

    // Formatear según la moneda
    if (currency === "ARS") {
      return `${(convertedValue / 1000).toFixed(0)}k`
    } else {
      // Para USD y USD_BLUE, mostrar con menos decimales
      return `${(convertedValue / 1000).toFixed(1)}k`
    }
  }

  // Función para obtener el símbolo de la moneda actual
  const getCurrencySymbol = () => {
    return currency.includes("USD") ? "$" : "$"
  }

  // Función para formatear los valores del tooltip según la moneda
  const formatTooltipValue = (value: number) => {
    return formatCurrency(value)
  }

  return (
    <div className="p-6 bg-[#F5F6FA] min-w-0 flex flex-col">
      <h2 className="mb-4 sm:mb-6 text-2xl sm:text-3xl font-bold">Dashboard</h2>

      {/* Selector de rango de fechas */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 items-start sm:items-end">
        <div className="w-full sm:w-auto">
          <label className="block text-sm font-medium mb-1">Fecha inicio</label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div className="w-full sm:w-auto">
          <label className="block text-sm font-medium mb-1">Fecha fin</label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
      </div>

      {/* Componente de estadísticas con datos reales */}
      <DashboardStats startDate={startDate} endDate={endDate} stats={stats} loading={loadingMovements} />

      <div className="mt-4 sm:mt-6">
        <Card className="shadow-lg border-none col-span-full">
          <CardHeader>
            <CardTitle>Evolución Mensual Acumulada - {getMonthRangeString(startDate, endDate)}</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingMovements ? (
              <div className="animate-pulse h-[350px] bg-gray-200 rounded"></div>
            ) : (
              <div className="mb-4">
                {/* Leyenda separada arriba del gráfico */}
                <div className="flex justify-center gap-6 mb-4">
                  <div className="flex items-center">
                    <div className="w-4 h-4 mr-2 bg-[#4ade80] rounded-full"></div>
                    <span>Ingresos Acumulados</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 mr-2 bg-[#f87171] rounded-full"></div>
                    <span>Egresos Acumulados</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 mr-2 bg-[#60a5fa] rounded-full border border-[#60a5fa] border-dashed"></div>
                    <span>Balance</span>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={cumulativeData} margin={{ top: 20, right: 30, left: 50, bottom: 60 }}>
                    <XAxis dataKey="day" label={{ value: "Día del mes", position: "insideBottom", offset: -25 }} />
                    <YAxis
                      label={{
                        value: `Monto (${getCurrencySymbol()})`,
                        angle: -90,
                        position: "insideLeft",
                        offset: -35,
                      }}
                      tickFormatter={formatYAxisTick}
                      width={80}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatTooltipValue(value), ""]}
                      labelFormatter={(label) => `Día ${label}`}
                    />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Line
                      type="monotone"
                      dataKey="ingresos"
                      name="Ingresos Acumulados"
                      stroke="#4ade80"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="egresos"
                      name="Egresos Acumulados"
                      stroke="#f87171"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      name="Balance"
                      stroke="#60a5fa"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 sm:mt-6 grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle>Distribución de Gastos por Categoría - {getMonthRangeString(startDate, endDate)}</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingMovements ? (
              <div className="animate-pulse h-[300px] bg-gray-200 rounded"></div>
            ) : expenseCategories.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No hay datos de gastos para este período
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expenseCategories}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      label={(entry) => entry.name}
                    >
                      {expenseCategories.map((entry, index) => (
    <Cell key={`expense-${entry.name}-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
))}
                    </Pie>
                    <Tooltip formatter={(value) => formatTooltipValue(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  {/* Leyenda de categorías de gastos */}
                  {expenseCategories.map((category, index) => (
                    <div key={category.name || index} className="flex items-center">
                      <div
                        className="w-3 h-3 mr-2 rounded-full"
                        style={{ backgroundColor: EXPENSE_COLORS[index % EXPENSE_COLORS.length] }}
                      />
                      <div className="truncate">
                        <div className="font-medium truncate">{category.name}</div>
                        <div className="text-muted-foreground">{formatCurrency(category.value)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle>Distribución de Ingresos por Categoría - {getMonthRangeString(startDate, endDate)}</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingMovements ? (
              <div className="animate-pulse h-[300px] bg-gray-200 rounded"></div>
            ) : incomeCategories.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No hay datos de ingresos para este período
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={incomeCategories}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      label={(entry) => entry.name}
                    >
                      {incomeCategories.map((entry, index) => (
    <Cell key={`income-${entry.name}-${index}`} fill={INCOME_COLORS[index % INCOME_COLORS.length]} />
))}
                    </Pie>
                    <Tooltip formatter={(value) => formatTooltipValue(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  {/* Leyenda de categorías de ingresos */}
                  {incomeCategories.map((category, index) => (
                    <div key={category.name || index} className="flex items-center">
                      <div
                        className="w-3 h-3 mr-2 rounded-full"
                        style={{ backgroundColor: INCOME_COLORS[index % INCOME_COLORS.length] }}
                      />
                      <div className="truncate">
                        <div className="font-medium truncate">{category.name}</div>
                        <div className="text-muted-foreground">{formatCurrency(category.value)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg border-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>
              {showIncomes ? "Mayores Ingresos" : "Principales Egresos"} - {getMonthRangeString(startDate, endDate)}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={toggleMovementType}
              title={showIncomes ? "Ver egresos" : "Ver ingresos"}
            >
              <ArrowLeftRight className="h-4 w-4" />
              <span className="sr-only">{showIncomes ? "Ver egresos" : "Ver ingresos"}</span>
            </Button>
          </CardHeader>
          <CardContent>
            {loadingMovements ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="flex items-center justify-between animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            ) : showIncomes ? (
              topIncomes.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No se encontraron ingresos en {getMonthRangeString(startDate, endDate)}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Top ingresos */}
                  {topIncomes.map((income, index) => (
                    <div key={income.id || index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="font-medium truncate max-w-[200px]">
                          {index + 1}. {income.description}
                        </div>
                      </div>
                      <div className="font-medium text-green-500">{formatCurrency(income.amount)}</div>
                    </div>
                  ))}
                </div>
              )
            ) : topExpenses.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No se encontraron egresos en {getMonthRangeString(startDate, endDate)}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Top egresos */}
                {topExpenses.map((expense, index) => (
                  <div key={expense.id || index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="font-medium truncate max-w-[200px]">
                        {index + 1}. {expense.description}
                      </div>
                    </div>
                    <div className="font-medium text-red-500">{formatCurrency(expense.amount)}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 sm:mt-6">
        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle>Comparativa Mensual: Ingresos vs Egresos</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingMovements ? (
              <div className="animate-pulse h-[450px] bg-gray-200 rounded"></div>
            ) : (
              <div className="mb-4">
                {/* Contenedor más alto para el gráfico */}
                <ResponsiveContainer width="100%" height={450}>
                  <BarChart
                    data={monthlyData}
                    margin={{ top: 20, right: 30, left: 50, bottom: 30 }}
                    barGap={0}
                    barCategoryGap={8}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" label={{ value: "Mes", position: "bottom", offset: 10 }} />
                    <YAxis
                      label={{
                        value: `Monto (${getCurrencySymbol()})`,
                        angle: -90,
                        position: "insideLeft",
                        offset: -35,
                      }}
                      tickFormatter={formatYAxisTick}
                      width={80}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => {
                        const label = name === "ingresos" ? "Ingresos" : name === "egresos" ? "Egresos" : "Balance"
                        return [formatTooltipValue(value), label]
                      }}
                      labelFormatter={(label) => `Mes: ${label}`}
                    />
                    <Legend verticalAlign="bottom" height={50} wrapperStyle={{ paddingTop: 0, bottom: 0 }} />
                    <Bar dataKey="ingresos" name="Ingresos" fill="#4ade80" radius={[4, 4, 0, 0]}>
                      {monthlyData.map((entry, index) => (
    <Cell key={`ingresos-${entry.monthKey}-${index}`} />
  ))}
</Bar>
<Bar dataKey="egresos" name="Egresos" fill="#f87171" radius={[4, 4, 0, 0]}>
  {monthlyData.map((entry, index) => (
    <Cell key={`egresos-${entry.monthKey}-${index}`} />
  ))}
</Bar>
<Bar dataKey="balance" name="Balance" fill="#60a5fa" radius={[4, 4, 0, 0]}>
  {monthlyData.map((entry, index) => (
    <Cell key={`balance-${entry.monthKey}-${index}`} />
  ))}
</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
