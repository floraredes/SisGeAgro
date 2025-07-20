"use client"

import { useState, useEffect } from "react"
import { DashboardStats } from "@/components/dashboard-stats"
import { Input } from "@/components/ui/input"


export default function DashboardPage() {
  // Rango de fechas por defecto: últimos 30 días
  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 30)
  const firstDay = thirtyDaysAgo
  const lastDay = today
  const [startDate, setStartDate] = useState<string>(firstDay.toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState<string>(lastDay.toISOString().slice(0, 10))

  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)

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
