"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { IncomeTable } from "@/components/income-table"
import { supabase } from "@/lib/supabase/supabaseClient"
import { useCurrency } from "@/contexts/currency-context"

// Función para obtener ingresos acumulativos por día
async function getCumulativeIncome(year: number, month: number) {
  const startDate = new Date(year, month - 1, 1).toISOString().split("T")[0]
  const endDate = new Date(year, month, 0).toISOString().split("T")[0]

  // Obtener todos los movimientos de ingreso del mes con sus facturas
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
    .eq("movement_type", "ingreso")

  if (error) throw error

  // Filtrar por fecha de factura dentro del mes
  const filteredData = data.filter((movement) => {
    const billDate = movement.operations?.bills?.bill_date
    return billDate && billDate >= startDate && billDate <= endDate
  })

  // Crear un objeto para almacenar los totales por día
  const dailyTotals: Record<string, { day: string; ingresos: number }> = {}

  // Inicializar todos los días del mes con valores en cero
  const daysInMonth = new Date(year, month, 0).getDate()
  for (let i = 1; i <= daysInMonth; i++) {
    const dayStr = i.toString().padStart(2, "0")
    dailyTotals[dayStr] = {
      day: dayStr,
      ingresos: 0,
    }
  }

  // Sumar los montos por día
  filteredData.forEach((movement) => {
    const billDate = movement.operations?.bills?.bill_date
    if (billDate) {
      const day = billDate.split("-")[2] // Extraer el día de la fecha (formato: YYYY-MM-DD)
      const amount = movement.operations?.bills?.bill_amount || 0
      dailyTotals[day].ingresos += amount
    }
  })

  // Convertir a array y ordenar por día
  const sortedDays = Object.keys(dailyTotals).sort((a, b) => Number.parseInt(a) - Number.parseInt(b))

  // Calcular valores acumulativos
  let cumulativeIngresos = 0

  const cumulativeData = sortedDays.map((day) => {
    cumulativeIngresos += dailyTotals[day].ingresos
    return {
      day,
      ingresos: cumulativeIngresos,
      ingresosDelDia: dailyTotals[day].ingresos, // También incluimos los ingresos diarios no acumulados
    }
  })

  return cumulativeData
}

export default function IngresosPage() {
  const [incomeData, setIncomeData] = useState<Array<{ day: string; ingresos: number; ingresosDelDia: number }>>([])
  const [loadingChart, setLoadingChart] = useState(true)
  const { formatCurrency, currency, convertAmount } = useCurrency()

  useEffect(() => {
    async function fetchIncomeData() {
      setLoadingChart(true)
      try {
        const today = new Date()
        const currentYear = today.getFullYear()
        const currentMonth = today.getMonth() + 1

        const data = await getCumulativeIncome(currentYear, currentMonth)
        setIncomeData(data)
      } catch (error) {
        console.error("Error fetching income data:", error)
      } finally {
        setLoadingChart(false)
      }
    }

    fetchIncomeData()
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
      <h2 className="mb-6 text-3xl font-bold">Ingresos</h2>

      <div className="mt-6">
        <Card className="shadow-lg border-none col-span-full">
          <CardHeader>
            <CardTitle>Evolución de Ingresos Mensuales</CardTitle>
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
                    <div className="w-4 h-4 mr-2 bg-[#60a5fa] rounded-full"></div>
                    <span>Ingresos Diarios</span>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={incomeData} margin={{ top: 20, right: 30, left: 50, bottom: 60 }}>
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
                        if (name === "ingresos") return [formatCurrency(value), "Ingresos Acumulados"]
                        if (name === "ingresosDelDia") return [formatCurrency(value), "Ingresos del Día"]
                        return [formatCurrency(value), name]
                      }}
                      labelFormatter={(label) => `Día ${label}`}
                    />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Line
                      type="monotone"
                      dataKey="ingresos"
                      name="Ingresos Acumulados"
                      stroke="#34d399"
                      strokeWidth={2}
                      dot={false}
                      activeDot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="ingresosDelDia"
                      name="Ingresos del Día"
                      stroke="#60a5fa"
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
            <CardTitle>Tabla de Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <IncomeTable />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
