"use client"

import { useState } from "react"
import { DashboardStats } from "@/components/dashboard-stats"
import { Input } from "@/components/ui/input"


export default function DashboardPage() {
  // Calcular fechas por defecto
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  // Leer de localStorage o usar por defecto
  const [startDate, setStartDate] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("dashboardStartDate") || firstDay.toISOString().slice(0, 10)
    }
    return firstDay.toISOString().slice(0, 10)
  })
  const [endDate, setEndDate] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("dashboardEndDate") || lastDay.toISOString().slice(0, 10)
    }
    return lastDay.toISOString().slice(0, 10)
  })

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
      <DashboardStats startDate={startDate} endDate={endDate} />
    </div>
  )
}
