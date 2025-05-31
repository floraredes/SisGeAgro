"use client"

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  { value: 5000, percentage: 20 },
  { value: 10000, percentage: 45 },
  { value: 15000, percentage: 40 },
  { value: 20000, percentage: 50 },
  { value: 25000, percentage: 90, amount: 64366.77 },
  { value: 30000, percentage: 45 },
  { value: 35000, percentage: 60 },
  { value: 40000, percentage: 30 },
  { value: 45000, percentage: 70 },
  { value: 50000, percentage: 55 },
  { value: 55000, percentage: 55 },
  { value: 60000, percentage: 50 },
]

export default function MonthlyIncomeChart() {
  return (
    <div className="w-full max-w-5xl mx-auto p-6 bg-white rounded-xl shadow-sm">
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="rgb(67, 121, 238)" stopOpacity={0.16} />
                <stop offset="100%" stopColor="rgb(255, 255, 255)" stopOpacity={0.18} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="value"
              tickFormatter={(value) => `${value / 1000}k`}
              stroke="#94a3b8"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
            />
            <YAxis
              tickFormatter={(value) => `${value}%`}
              stroke="#94a3b8"
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              ticks={[20, 40, 60, 80, 100]}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
            />
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={true}
              vertical={false}
              stroke="#e2e8f0"
              strokeOpacity={0.8}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="bg-white p-2 border rounded shadow-sm">
                      {data.amount ? (
                        <p className="text-sm font-medium text-emerald-600">
                          {data.amount.toLocaleString("es-ES", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-600">{`${data.percentage}%`}</p>
                      )}
                    </div>
                  )
                }
                return null
              }}
            />
            <Area
              type="monotone"
              dataKey="percentage"
              stroke="#82ca9d"
              strokeWidth={2.5}
              fill="url(#colorValue)"
              fillOpacity={1}
              dot={{
                stroke: "#82ca9d",
                strokeWidth: 2,
                r: 4,
                fill: "white",
              }}
              activeDot={{
                stroke: "#82ca9d",
                strokeWidth: 2,
                r: 6,
                fill: "white",
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

