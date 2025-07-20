"use client"

import { TransactionsTable } from "./transactions-table"

export function IncomeTable({ movements }: { movements?: any[] }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <TransactionsTable movementType="ingreso" showMovementTypeFilter={false} title="Tabla de Ingresos" movements={movements} />
    </div>
  )
}

