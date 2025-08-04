"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { IncomeTable } from "@/components/income-table"
import { supabase } from "@/lib/supabase/supabaseClient"
import { useCurrency } from "@/contexts/currency-context"
import { getIncomes } from "@/lib/api-utils"
import { Input } from "@/components/ui/input"

// Función para obtener ingresos acumulativos por día
async function getCumulativeIncome(year: number, month: number) {
  const startDate = new Date(year, month - 1, 1).toISOString().split("T")[0]
  const endDate = new Date(year, month, 0).toISOString().split("T")[0]

  // Obtener todos los movimientos de ingreso del mes con sus facturas usando la API interna
  const data = await getIncomes(startDate, endDate)

  // Recorrer todas las operaciones y bills
  const billsList: { bill_date: string, bill_amount: number }[] = []
  data.forEach((movement: any) => {
    if (Array.isArray(movement.operations)) {
      movement.operations.forEach((op: any) => {
        if (Array.isArray(op.bills)) {
          op.bills.forEach((bill: any) => {
            billsList.push({ bill_date: bill.bill_date, bill_amount: bill.bill_amount })
          })
        } else if (op.bills) {
          billsList.push({ bill_date: op.bills.bill_date, bill_amount: op.bills.bill_amount })
        }
      })
    } else if (movement.operations?.bills) {
      if (Array.isArray(movement.operations.bills)) {
        movement.operations.bills.forEach((bill: any) => {
          billsList.push({ bill_date: bill.bill_date, bill_amount: bill.bill_amount })
        })
      } else {
        billsList.push({ bill_date: movement.operations.bills.bill_date, bill_amount: movement.operations.bills.bill_amount })
      }
    }
  })

  // Filtrar por fecha de factura dentro del mes
  const filteredBills = billsList.filter(bill => bill.bill_date && bill.bill_date >= startDate && bill.bill_date <= endDate)

  // Crear un objeto para almacenar los totales por día
  const dailyTotals: Record<string, { day: string; ingresos: number }> = {}
  const daysInMonth = new Date(year, month, 0).getDate()
  for (let i = 1; i <= daysInMonth; i++) {
    const dayStr = i.toString().padStart(2, "0")
    dailyTotals[dayStr] = {
      day: dayStr,
      ingresos: 0,
    }
  }

  // Sumar los montos por día
  filteredBills.forEach((bill) => {
    if (bill.bill_date) {
      const day = bill.bill_date.split("-")[2]
      const amount = bill.bill_amount || 0
      dailyTotals[day].ingresos += amount
    }
  })

  // Convertir a array y ordenar por día
  const sortedDays = Object.keys(dailyTotals).sort((a, b) => Number.parseInt(a) - Number.parseInt(b))
  let cumulativeIngresos = 0
  const cumulativeData = sortedDays.map((day) => {
    cumulativeIngresos += dailyTotals[day].ingresos
    return {
      day,
      ingresos: cumulativeIngresos,
      ingresosDelDia: dailyTotals[day].ingresos,
    }
  })
  return cumulativeData
}

export default function IngresosPage() {
  // Rango de fechas por defecto: últimos 30 días
  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 30)
  const firstDay = thirtyDaysAgo
  const lastDay = today
  const [startDate, setStartDate] = useState<string>(firstDay.toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState<string>(lastDay.toISOString().slice(0, 10))

  const [incomeData, setIncomeData] = useState<Array<{ day: string; ingresos: number; ingresosDelDia: number }>>([])
  const [loadingChart, setLoadingChart] = useState(true)
  const { formatCurrency, currency, convertAmount } = useCurrency()
  const [movements, setMovements] = useState<any[]>([])

  // Obtener movimientos de ingresos para la tabla y la gráfica
  useEffect(() => {
    async function fetchIncomeData() {
      setLoadingChart(true)
      try {
        // Obtener movimientos de ingresos en el rango
        const movimientos = await getIncomes(startDate, endDate)
        setMovements(movimientos)
        // Procesar para la gráfica
        // Recorrer todas las operaciones y bills
        const billsList: { bill_date: string, bill_amount: number }[] = []
        movimientos.forEach((movement: any) => {
          if (Array.isArray(movement.operations)) {
            movement.operations.forEach((op: any) => {
              if (Array.isArray(op.bills)) {
                op.bills.forEach((bill: any) => {
                  billsList.push({ bill_date: bill.bill_date, bill_amount: bill.bill_amount })
                })
              } else if (op.bills) {
                billsList.push({ bill_date: op.bills.bill_date, bill_amount: op.bills.bill_amount })
              }
            })
          } else if (movement.operations?.bills) {
            if (Array.isArray(movement.operations.bills)) {
              movement.operations.bills.forEach((bill: any) => {
                billsList.push({ bill_date: bill.bill_date, bill_amount: bill.bill_amount })
              })
            } else {
              billsList.push({ bill_date: movement.operations.bills.bill_date, bill_amount: movement.operations.bills.bill_amount })
            }
          }
        })
        // Filtrar por fecha de factura dentro del rango
        const filteredBills = billsList.filter(bill => bill.bill_date && bill.bill_date >= startDate && bill.bill_date <= endDate)
        // Crear un objeto para almacenar los totales por día
        const dailyTotals: Record<string, { day: string; ingresos: number }> = {}
        const start = new Date(startDate)
        const end = new Date(endDate)
        let d = new Date(start)
        while (d <= end) {
          const dayStr = d.getDate().toString().padStart(2, "0")
          dailyTotals[dayStr] = { day: dayStr, ingresos: 0 }
          d.setDate(d.getDate() + 1)
        }
        // Sumar los montos por día
        filteredBills.forEach((bill) => {
          if (bill.bill_date) {
            const day = bill.bill_date.split("-")[2]
            const amount = bill.bill_amount || 0
            dailyTotals[day].ingresos += amount
          }
        })
        // Convertir a array y ordenar por día
        const sortedDays = Object.keys(dailyTotals).sort((a, b) => Number.parseInt(a) - Number.parseInt(b))
        let cumulativeIngresos = 0
        const cumulativeData = sortedDays.map((day) => {
          cumulativeIngresos += dailyTotals[day].ingresos
          return {
            day,
            ingresos: cumulativeIngresos,
            ingresosDelDia: dailyTotals[day].ingresos,
          }
        })
        setIncomeData(cumulativeData)
      } catch (error) {
        console.error("Error fetching income data:", error)
      } finally {
        setLoadingChart(false)
      }
    }
    fetchIncomeData()
  }, [startDate, endDate])

  // Función para formatear los valores del eje Y según la moneda seleccionada
  const formatYAxisTick = (value: number) => {
    const convertedValue = convertAmount(value, "ARS", currency)
    if (currency === "ARS") {
      return `${(convertedValue / 1000).toFixed(0)}k`
    } else {
      return `${(convertedValue / 1000).toFixed(1)}k`
    }
  }
  const getCurrencySymbol = () => {
    return currency.includes("USD") ? "$" : "$"
  }

  // Filtrar movimientos para la tabla según el rango de fechas
  const filteredMovements = movements.filter((movement: any) => {
    let bills: any[] = []
    if (Array.isArray(movement.operations)) {
      movement.operations.forEach((op: any) => {
        if (Array.isArray(op.bills)) {
          bills = bills.concat(op.bills)
        } else if (op.bills) {
          bills.push(op.bills)
        }
      })
    } else if (movement.operations?.bills) {
      if (Array.isArray(movement.operations.bills)) {
        bills = bills.concat(movement.operations.bills)
      } else {
        bills.push(movement.operations.bills)
      }
    }
    return bills.some(bill => bill.bill_date && bill.bill_date >= startDate && bill.bill_date <= endDate)
  })

  return (
    <div className="p-6 bg-[#F5F6FA] min-w-0 flex flex-col">
      <h2 className="mb-4 sm:mb-6 text-2xl sm:text-3xl font-bold">Ingresos</h2>
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
      <div className="mt-6">
        <Card className="shadow-lg border-none col-span-full">
          <CardHeader>
            <CardTitle>Evolución de Ingresos</CardTitle>
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
                    <XAxis dataKey="day" label={{ value: "Día", position: "insideBottom", offset: -25 }} />
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
            <IncomeTable movements={filteredMovements} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
