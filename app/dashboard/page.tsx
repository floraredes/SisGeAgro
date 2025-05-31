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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useCurrency } from "@/contexts/currency-context"

// Añadir esta función para obtener fechas de inicio y fin de un mes
function getMonthDates(year: number, month: number) {
  const startDate = `${year}-${month.toString().padStart(2, "0")}-01`
  const endDate = `${year}-${month.toString().padStart(2, "0")}-${new Date(year, month, 0).getDate()}`
  return { startDate, endDate }
}

// Modificar la función para aceptar año y mes como parámetros
async function getCumulativeMovements(year: number, month: number) {
  const { startDate, endDate } = getMonthDates(year, month)

  // Obtener todos los movimientos del mes con sus facturas
  const { data, error } = await supabase
    .from("movements")
    .select(`
      movement_type,
      operations:operation_id (
        bills:bill_id (
          bill_amount,
          bill_date
        )
      )
    `)
    .or(`movement_type.eq.ingreso,movement_type.eq.egreso`)

  if (error) throw error

  // Filtrar por fecha de factura dentro del mes
  const filteredData = data.filter((movement) => {
    const billDate = movement.operations?.bills?.bill_date
    return billDate && billDate >= startDate && billDate <= endDate
  })

  // Crear un objeto para almacenar los totales por día
  const dailyTotals: Record<string, { day: string; ingresos: number; egresos: number }> = {}

  // Inicializar todos los días del mes con valores en cero
  const daysInMonth = new Date(year, month, 0).getDate()
  for (let i = 1; i <= daysInMonth; i++) {
    const dayStr = i.toString().padStart(2, "0")
    dailyTotals[dayStr] = {
      day: dayStr,
      ingresos: 0,
      egresos: 0,
    }
  }

  // Sumar los montos por día y tipo de movimiento
  filteredData.forEach((movement) => {
    const billDate = movement.operations?.bills?.bill_date
    if (billDate) {
      const day = billDate.split("-")[2] // Extraer el día de la fecha (formato: YYYY-MM-DD)
      const amount = movement.operations?.bills?.bill_amount || 0

      if (movement.movement_type === "ingreso") {
        dailyTotals[day].ingresos += amount
      } else if (movement.movement_type === "egreso") {
        dailyTotals[day].egresos += amount
      }
    }
  })

  // Convertir a array y ordenar por día
  const sortedDays = Object.keys(dailyTotals).sort((a, b) => Number.parseInt(a) - Number.parseInt(b))

  // Calcular valores acumulativos
  let cumulativeIngresos = 0
  let cumulativeEgresos = 0

  const cumulativeData = sortedDays.map((day) => {
    cumulativeIngresos += dailyTotals[day].ingresos
    cumulativeEgresos += dailyTotals[day].egresos

    return {
      day,
      ingresos: cumulativeIngresos,
      egresos: cumulativeEgresos,
      balance: cumulativeIngresos - cumulativeEgresos,
    }
  })

  return cumulativeData
}

// Modificar la función para aceptar año y mes como parámetros
async function getExpensesByCategory(year: number, month: number) {
  const { startDate, endDate } = getMonthDates(year, month)

  const { data, error } = await supabase
    .from("movements")
    .select(`
      sub_category_id,
      operations:operation_id (
        bills:bill_id (
          bill_amount,
          bill_date
        )
      ),
      sub_categories:sub_category_id (
        categories:category_id (
          description
        )
      )
    `)
    .eq("movement_type", "egreso")

  if (error) throw error

  // Filtrar por fecha dentro del mes seleccionado
  const filteredData = data.filter((movement) => {
    const billDate = movement.operations?.bills?.bill_date
    return billDate && billDate >= startDate && billDate <= endDate
  })

  // Agrupar por categoría
  const categoryTotals: Record<string, number> = {}

  filteredData.forEach((movement) => {
    const categoryName = movement.sub_categories?.categories?.description || "Sin categoría"
    const amount = movement.operations?.bills?.bill_amount || 0

    if (!categoryTotals[categoryName]) {
      categoryTotals[categoryName] = 0
    }
    categoryTotals[categoryName] += amount
  })

  // Convertir a array para el gráfico
  return Object.entries(categoryTotals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value) // Ordenar de mayor a menor
    .slice(0, 5) // Tomar los 5 principales
}

// Modificar la función para aceptar año y mes como parámetros
async function getIncomesByCategory(year: number, month: number) {
  const { startDate, endDate } = getMonthDates(year, month)

  const { data, error } = await supabase
    .from("movements")
    .select(`
      sub_category_id,
      operations:operation_id (
        bills:bill_id (
          bill_amount,
          bill_date
        )
      ),
      sub_categories:sub_category_id (
        categories:category_id (
          description
        )
      )
    `)
    .eq("movement_type", "ingreso")

  if (error) throw error

  // Filtrar por fecha dentro del mes seleccionado
  const filteredData = data.filter((movement) => {
    const billDate = movement.operations?.bills?.bill_date
    return billDate && billDate >= startDate && billDate <= endDate
  })

  // Agrupar por categoría
  const categoryTotals: Record<string, number> = {}

  filteredData.forEach((movement) => {
    const categoryName = movement.sub_categories?.categories?.description || "Sin categoría"
    const amount = movement.operations?.bills?.bill_amount || 0

    if (!categoryTotals[categoryName]) {
      categoryTotals[categoryName] = 0
    }
    categoryTotals[categoryName] += amount
  })

  // Convertir a array para el gráfico
  return Object.entries(categoryTotals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value) // Ordenar de mayor a menor
    .slice(0, 5) // Tomar los 5 principales
}

// Modificar la función para aceptar año y mes como parámetros
async function getMonthlyMovements(selectedYear: number, selectedMonth: number) {
  // Calcular fecha de inicio (12 meses atrás desde el mes seleccionado)
  const selectedDate = new Date(selectedYear, selectedMonth - 1, 1)
  const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split("T")[0]

  const startDate = new Date(selectedDate)
  startDate.setMonth(selectedDate.getMonth() - 11) // 12 meses incluyendo el seleccionado
  startDate.setDate(1) // Primer día del mes
  const startDateStr = startDate.toISOString().split("T")[0]

  // Obtener todos los movimientos en el rango de fechas
  const { data, error } = await supabase
    .from("movements")
    .select(`
      movement_type,
      operations:operation_id (
        bills:bill_id (
          bill_amount,
          bill_date
        )
      )
    `)
    .or(`movement_type.eq.ingreso,movement_type.eq.egreso`)
    .gte("operations.bills.bill_date", startDateStr)
    .lte("operations.bills.bill_date", endDate)

  if (error) throw error

  // Crear objeto para almacenar totales por mes
  const monthlyTotals: Record<string, { month: string; ingresos: number; egresos: number; balance: number }> = {}

  // Inicializar los últimos 12 meses con valores en cero
  for (let i = 0; i < 12; i++) {
    const monthDate = new Date(selectedDate)
    monthDate.setMonth(selectedDate.getMonth() - i)

    const year = monthDate.getFullYear()
    const month = monthDate.getMonth() + 1

    // Formato YYYY-MM para agrupar
    const monthKey = `${year}-${month.toString().padStart(2, "0")}`

    // Nombre del mes para mostrar en el gráfico
    const monthName = monthDate.toLocaleString("es-ES", { month: "short" })

    monthlyTotals[monthKey] = {
      month: monthName,
      ingresos: 0,
      egresos: 0,
      balance: 0,
    }
  }

  // Sumar los montos por mes y tipo de movimiento
  data?.forEach((movement) => {
    const billDate = movement.operations?.bills?.bill_date
    if (billDate) {
      // Extraer año y mes de la fecha (formato: YYYY-MM-DD)
      const [year, month] = billDate.split("-")
      const monthKey = `${year}-${month}`

      // Verificar si el mes está dentro de nuestro rango (últimos 12 meses)
      if (monthlyTotals[monthKey]) {
        const amount = movement.operations?.bills?.bill_amount || 0

        if (movement.movement_type === "ingreso") {
          monthlyTotals[monthKey].ingresos += amount
        } else if (movement.movement_type === "egreso") {
          monthlyTotals[monthKey].egresos += amount
        }
      }
    }
  })

  // Calcular balance para cada mes
  Object.keys(monthlyTotals).forEach((key) => {
    monthlyTotals[key].balance = monthlyTotals[key].ingresos - monthlyTotals[key].egresos
  })

  // Convertir a array y ordenar por fecha (de más antiguo a más reciente)
  return Object.entries(monthlyTotals)
    .map(([key, data]) => ({
      monthKey: key,
      ...data,
    }))
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
}

async function getTopIncomesOfMonth(year: number, month: number) {
  const { startDate, endDate } = getMonthDates(year, month)

  const { data, error } = await supabase
    .from("movements")
    .select(`
      id,
      description,
      operations:operation_id (
        bills:bill_id (
          bill_amount,
          bill_date
        )
      )
    `)
    .eq("movement_type", "ingreso")
    .gte("operations.bills.bill_date", startDate)
    .lte("operations.bills.bill_date", endDate)

  if (error) throw error

  const incomes = data.map((income) => ({
    id: income.id,
    description: income.description,
    amount: income.operations?.bills?.bill_amount || 0,
  }))

  // Ordenar por monto de mayor a menor y tomar los 5 primeros
  return incomes.sort((a, b) => b.amount - a.amount).slice(0, 5)
}

async function getTopExpensesOfMonth(year: number, month: number) {
  const { startDate, endDate } = getMonthDates(year, month)

  const { data, error } = await supabase
    .from("movements")
    .select(`
      id,
      description,
      operations:operation_id (
        bills:bill_id (
          bill_amount,
          bill_date
        )
      )
    `)
    .eq("movement_type", "egreso")
    .gte("operations.bills.bill_date", startDate)
    .lte("operations.bills.bill_date", endDate)

  if (error) throw error

  const expenses = data.map((expense) => ({
    id: expense.id,
    description: expense.description,
    amount: expense.operations?.bills?.bill_amount || 0,
  }))

  // Ordenar por monto de mayor a menor y tomar los 5 primeros
  return expenses.sort((a, b) => b.amount - a.amount).slice(0, 5)
}

// Reemplazar la función export default con la siguiente implementación
export default function DashboardPage() {
  // Añadir estado para el período seleccionado
  const [period, setPeriod] = useState<"current" | "previous">("current")

  const [cumulativeData, setCumulativeData] = useState<
    Array<{ day: string; ingresos: number; egresos: number; balance: number }>
  >([])
  const [expenseCategories, setExpenseCategories] = useState<Array<{ name: string; value: number }>>([])
  const [incomeCategories, setIncomeCategories] = useState<Array<{ name: string; value: number }>>([])
  const [topIncomes, setTopIncomes] = useState<Array<{ id: string; description: string; amount: number }>>([])
  const [topExpenses, setTopExpenses] = useState<Array<{ id: string; description: string; amount: number }>>([])
  const [monthlyData, setMonthlyData] = useState<
    Array<{ month: string; ingresos: number; egresos: number; balance: number }>
  >([])
  const [loadingChart, setLoadingChart] = useState(true)
  const [loadingPieCharts, setLoadingPieCharts] = useState(true)
  const [loadingTopMovements, setLoadingTopMovements] = useState(true)
  const [loadingMonthlyChart, setLoadingMonthlyChart] = useState(true)
  const [showIncomes, setShowIncomes] = useState(true) // Estado para controlar qué datos mostrar

  const { formatCurrency, currency, convertAmount } = useCurrency()

  // Función para obtener el año y mes según el período seleccionado
  const getSelectedYearAndMonth = () => {
    const today = new Date()
    if (period === "current") {
      return {
        year: today.getFullYear(),
        month: today.getMonth() + 1,
      }
    } else {
      // Mes anterior
      const previousMonth = new Date(today)
      previousMonth.setMonth(today.getMonth() - 1)
      return {
        year: previousMonth.getFullYear(),
        month: previousMonth.getMonth() + 1,
      }
    }
  }

  // Función para obtener el nombre del mes
  const getMonthName = (date: Date) => {
    return date.toLocaleString("es-ES", { month: "long" })
  }

  // Obtener el nombre del mes según el período seleccionado
  const getSelectedMonthName = () => {
    const today = new Date()
    if (period === "current") {
      return getMonthName(today)
    } else {
      const previousMonth = new Date(today)
      previousMonth.setMonth(today.getMonth() - 1)
      return getMonthName(previousMonth)
    }
  }

  useEffect(() => {
    async function fetchDashboardData() {
      setLoadingChart(true)
      setLoadingPieCharts(true)
      setLoadingTopMovements(true)
      setLoadingMonthlyChart(true)
      try {
        const { year, month } = getSelectedYearAndMonth()

        const data = await getCumulativeMovements(year, month)
        const categoriesData = await getExpensesByCategory(year, month)
        const incomesData = await getIncomesByCategory(year, month)
        const topIncomesData = await getTopIncomesOfMonth(year, month)
        const topExpensesData = await getTopExpensesOfMonth(year, month)
        const monthlyMovementsData = await getMonthlyMovements(year, month)

        setCumulativeData(data)
        setExpenseCategories(categoriesData)
        setIncomeCategories(incomesData)
        setTopIncomes(topIncomesData)
        setTopExpenses(topExpensesData)
        setMonthlyData(monthlyMovementsData)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoadingChart(false)
        setLoadingPieCharts(false)
        setLoadingTopMovements(false)
        setLoadingMonthlyChart(false)
      }
    }

    fetchDashboardData()
  }, [period]) // Añadir period como dependencia para recargar cuando cambie

  // Colores para los gráficos de torta
  const EXPENSE_COLORS = ["#4F7942", "#6B9362", "#8FB283", "#A6C29F", "#C1D2BC"]
  const INCOME_COLORS = ["#2D5016", "#4F7942", "#6B9362", "#8FB283", "#A6C29F"]

  // Función para alternar entre ingresos y egresos
  const toggleMovementType = () => {
    setShowIncomes(!showIncomes)
  }

  // Obtener el nombre del mes seleccionado
  const selectedMonthName = getSelectedMonthName()
  const selectedMonthCapitalized = selectedMonthName.charAt(0).toUpperCase() + selectedMonthName.slice(1)

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
    <div className="p-6 bg-[#F5F6FA]">
      <h2 className="mb-6 text-3xl font-bold">Dashboard</h2>

      {/* Selector de período */}
      <div className="flex justify-end mb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="bg-white">
              {period === "current" ? "Mes actual" : "Mes anterior"}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setPeriod("current")}>Mes actual</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPeriod("previous")}>Mes anterior</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Componente de estadísticas con datos reales */}
      <DashboardStats period={period} onPeriodChange={setPeriod} />

      <div className="mt-6">
        <Card className="shadow-lg border-none col-span-full">
          <CardHeader>
            <CardTitle>Evolución Mensual Acumulada - {selectedMonthCapitalized}</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingChart ? (
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

      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle>Distribución de Gastos por Categoría - {selectedMonthCapitalized}</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPieCharts ? (
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
                        <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatTooltipValue(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  {expenseCategories.map((category, index) => (
                    <div key={index} className="flex items-center">
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
            <CardTitle>Distribución de Ingresos por Categoría - {selectedMonthCapitalized}</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPieCharts ? (
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
                        <Cell key={`cell-${index}`} fill={INCOME_COLORS[index % INCOME_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatTooltipValue(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  {incomeCategories.map((category, index) => (
                    <div key={index} className="flex items-center">
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
              {showIncomes ? "Mayores Ingresos" : "Principales Egresos"} - {selectedMonthCapitalized}
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
            {loadingTopMovements ? (
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
                  No se encontraron ingresos en {selectedMonthCapitalized}
                </div>
              ) : (
                <div className="space-y-4">
                  {topIncomes.map((income, index) => (
                    <div key={income.id} className="flex items-center justify-between">
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
                No se encontraron egresos en {selectedMonthCapitalized}
              </div>
            ) : (
              <div className="space-y-4">
                {topExpenses.map((expense, index) => (
                  <div key={expense.id} className="flex items-center justify-between">
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

      <div className="mt-6">
        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle>Comparativa Mensual: Ingresos vs Egresos</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingMonthlyChart ? (
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
                    <Bar dataKey="ingresos" name="Ingresos" fill="#4ade80" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="egresos" name="Egresos" fill="#f87171" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="balance" name="Balance" fill="#60a5fa" radius={[4, 4, 0, 0]} />
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
