"use client"

import { Card } from "@/components/ui/card"
import { TransactionsTable } from "@/components/transactions-table"

export default function TablaPage() {
  return (
    <div className="p-6 bg-[#F5F6FA] h-full w-full overflow-auto">
      <Card className="p-6 shadow-lg border-none">
        <h2 className="text-2xl font-bold mb-6">Tabla completa de movimientos</h2>
        <TransactionsTable movementType="all" showMovementTypeFilter={true} />
      </Card>
    </div>
  )
}

