"use client"

import { TransactionsTable } from "./transactions-table"

export function ExpenseTable() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <TransactionsTable movementType="egreso" showMovementTypeFilter={false} title="Tabla de Egresos" />
    </div>
  )
}

