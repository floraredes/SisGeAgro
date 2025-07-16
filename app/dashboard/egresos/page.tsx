"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ExpenseTable } from "@/components/expense-table"
import { supabase } from "@/lib/supabase/supabaseClient"
import { useCurrency } from "@/contexts/currency-context"

// Función para obtener egresos acumulativos por día
async function getCumulativeExpenses(year: number, month: number) {
  const startDate = new Date(year, month - 1, 1).toISOString().split("T")[0]
  const endDate = new Date(year, month, 0).toISOString().split("T")[0]

  // Obtener todos los movimientos de egreso del mes con sus facturas
  const { data, error } = await supabase
    .from("movements")
    .select(`
      operations:operation_id (
        bills:bill_id (
          bill_amount,
          bill_date
        )
      )
    `)
    .eq("movement_type", "egreso")

  if (error) throw error

  // Filtrar por fecha de factura dentro del mes
  const filteredData = data.filter((movement) => {
    const billDate = movement.operations?.bills?.bill_date
    return billDate && billDate >= startDate && billDate <= endDate
  })

  // Crear un objeto para almacenar los totales por día
  const dailyTotals: Record<string, { day: string; egresos: number }> = {}

  // Inicializar todos los días del mes con valores en cero
  const daysInMonth = new Date(year, month, 0).getDate()
  for (let i = 1; i <= daysInMonth; i++) {
    const dayStr = i.toString().padStart(2, "0")
    dailyTotals[dayStr] = {
      day: dayStr,
      egresos: 0,
    }
  }

  // Sumar los montos por día
  filteredData.forEach((movement) => {
    const billDate = movement.operations?.bills?.bill_date
    if (billDate) {
      const day = billDate.split("-")[2] // Extraer el día de la fecha (formato: YYYY-MM-DD)
      const amount = movement.operations?.bills?.bill_amount || 0
      dailyTotals[day].egresos += amount
    }
  })

  // Convertir a array y ordenar por día
  const sortedDays = Object.keys(dailyTotals).sort((a, b) => Number.parseInt(a) - Number.parseInt(b))

  // Calcular valores acumulativos
  let cumulativeEgresos = 0

  const cumulativeData = sortedDays.map((day) => {
    cumulativeEgresos += dailyTotals[day].egresos
    return {
      day,
      egresos: cumulativeEgresos,
      egresosDelDia: dailyTotals[day].egresos, // También incluimos los egresos diarios no acumulados
    }
  })

  return cumulativeData
}

export default function EgresosPage() {
  const [expenseData, setExpenseData] = useState<Array<{ day: string; egresos: number; egresosDelDia: number }>>([])
  const [loadingChart, setLoadingChart] = useState(true)
  const { formatCurrency, currency, convertAmount } = useCurrency()

  useEffect(() => {
    async function fetchExpenseData() {
      setLoadingChart(true)
      try {
        const today = new Date()
        const currentYear = today.getFullYear()
        const currentMonth = today.getMonth() + 1

        const data = await getCumulativeExpenses(currentYear, currentMonth)
        setExpenseData(data)
      } catch (error) {
        console.error("Error fetching expense data:", error)
      } finally {
        setLoadingChart(false)
      }
    }

    fetchExpenseData()
  }, [])

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

  return (
    <>
      <h2 className="mb-6 text-3xl font-bold">Egresos</h2>

      <div className="mt-6">
        <Card className="shadow-lg border-none col-span-full">
          <CardHeader>
            <CardTitle>Evolución de Egresos Mensuales</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingChart ? (
              <div className="animate-pulse h-[350px] bg-gray-200 rounded"></div>
            ) : (
              <div className="mb-4">
                {/* Leyenda separada arriba del gráfico */}
                <div className="flex justify-center gap-6 mb-4">
                  <div className="flex items-center">
                    <div className="w-4 h-4 mr-2 bg-[#f87171] rounded-full"></div>
                    <span>Egresos Acumulados</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 mr-2 bg-[#fb923c] rounded-full"></div>
                    <span>Egresos Diarios</span>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={expenseData} margin={{ top: 20, right: 30, left: 50, bottom: 60 }}>
                    <XAxis dataKey="day" label={{ value: "Día del mes", position: "insideBottom", offset: -25 }} />
                    <YAxis
                      label={{
                        value: `Monto (${getCurrencySymbol()})`,
                        angle: -90,
                        position: "insideLeft",
                        offset: -30,
                      }}
                      tickFormatter={formatYAxisTick}
                      width={80}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => {
                        if (name === "egresos") return [formatCurrency(value), "Egresos Acumulados"]
                        if (name === "egresosDelDia") return [formatCurrency(value), "Egresos del Día"]
                        return [formatCurrency(value), name]
                      }}
                      labelFormatter={(label) => `Día ${label}`}
                    />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Line
                      type="monotone"
                      dataKey="egresos"
                      name="Egresos Acumulados"
                      stroke="#f87171"
                      strokeWidth={2}
                      dot={false}
                      activeDot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="egresosDelDia"
                      name="Egresos del Día"
                      stroke="#fb923c"
                      strokeWidth={2}
                      dot={false}
                      activeDot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle>Tabla de Egresos</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseTable />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
