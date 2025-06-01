"use client"

import { useState } from "react"
import Image from "next/image"
import { Check, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useCurrency, type CurrencyType } from "@/contexts/currency-context"

export function CurrencySelector() {
  const { currency, setCurrency, exchangeRates, isLoading } = useCurrency()
  const [isOpen, setIsOpen] = useState(false)

  // Configuración de las monedas disponibles
  const currencies = [
    {
      value: "ARS",
      label: "ARS",
      flagSrc: "/images/argentina-flag.png",
      name: "Peso Argentino",
    },
    {
      value: "USD",
      label: "USD OFICIAL",
      flagSrc: "/images/usa-flag.png",
      name: "Dólar Oficial",
      rate: exchangeRates?.USD,
    },
    {
      value: "USD_BLUE",
      label: "USD BLUE",
      flagSrc: "/images/usa-flag.png",
      name: "Dólar Blue",
      rate: exchangeRates?.USD_BLUE,
    },
  ]

  // Encontrar la moneda seleccionada
  const selectedCurrency = currencies.find((c) => c.value === currency) || currencies[0]

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 bg-white border-gray-200 hover:bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-8">
              <Image
                src={selectedCurrency.flagSrc || "/placeholder.svg"}
                alt={selectedCurrency.name}
                width={24}
                height={16}
                className="object-cover border border-gray-200"
                style={{ aspectRatio: "3/2" }}
              />
            </div>
            <span className="font-medium">{selectedCurrency.label}</span>
          </div>
          <ChevronDown className="w-4 h-4 ml-1 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[220px]">
        {currencies.map((item) => (
          <DropdownMenuItem
            key={item.value}
            className="flex items-center justify-between py-2 px-3 cursor-pointer"
            onClick={() => {
              setCurrency(item.value as CurrencyType)
              setIsOpen(false)
            }}
          >
            <div className="flex items-center gap-2">
              <Image
                src={item.flagSrc || "/placeholder.svg"}
                alt={item.name}
                width={24}
                height={16}
                className="object-cover border border-gray-200"
                style={{ aspectRatio: "3/2" }}
              />
              <div className="flex flex-col">
                <span className="font-medium">{item.name}</span>
                {item.rate && (
                  <span className="text-xs text-muted-foreground">
                    1 {item.value === "USD" ? "USD" : "USD Blue"} = {item.rate.toLocaleString("es-AR")} ARS
                  </span>
                )}
              </div>
            </div>
            {currency === item.value && <Check className="w-4 h-4 text-green-600" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
