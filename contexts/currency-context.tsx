"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

// Tipos de moneda disponibles
export type CurrencyType = "ARS" | "USD" | "USD_BLUE"

// Estructura para las tasas de cambio
export interface ExchangeRates {
  USD: number // Valor del dólar oficial en pesos
  USD_BLUE: number // Valor del dólar blue en pesos
  lastUpdated: Date
}

// Interfaz del contexto
interface CurrencyContextType {
  currency: CurrencyType
  setCurrency: (currency: CurrencyType) => void
  exchangeRates: ExchangeRates | null
  isLoading: boolean
  error: string | null
  formatCurrency: (amount: number) => string
  convertAmount: (amount: number, from?: CurrencyType, to?: CurrencyType) => number
}

// Valores por defecto
const defaultExchangeRates: ExchangeRates = {
  USD: 1000, // Valor predeterminado hasta que se carguen los datos reales
  USD_BLUE: 1200, // Valor predeterminado hasta que se carguen los datos reales
  lastUpdated: new Date(),
}

// Crear el contexto
const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

// Proveedor del contexto
export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyType>("ARS")
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Función para obtener las tasas de cambio desde la API
  useEffect(() => {
    async function fetchExchangeRates() {
      try {
        setIsLoading(true)
        setError(null)

        // Obtener dólar oficial
        const officialResponse = await fetch("https://dolarapi.com/v1/dolares/oficial")
        const officialData = await officialResponse.json()

        // Obtener dólar blue
        const blueResponse = await fetch("https://dolarapi.com/v1/dolares/blue")
        const blueData = await blueResponse.json()

        // Actualizar las tasas de cambio
        setExchangeRates({
          USD: officialData.venta, // Usamos el valor de venta
          USD_BLUE: blueData.venta, // Usamos el valor de venta
          lastUpdated: new Date(),
        })
      } catch (err) {
        console.error("Error fetching exchange rates:", err)
        setError("No se pudieron obtener las tasas de cambio. Usando valores predeterminados.")
        // Usar valores predeterminados en caso de error
        setExchangeRates(defaultExchangeRates)
      } finally {
        setIsLoading(false)
      }
    }

    fetchExchangeRates()

    // Actualizar las tasas cada hora
    const interval = setInterval(fetchExchangeRates, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Función para convertir montos entre diferentes monedas
  const convertAmount = (amount: number, from: CurrencyType = currency, to: CurrencyType = currency): number => {
    if (!exchangeRates) return amount

    // Si las monedas son iguales, no hay conversión
    if (from === to) return amount

    // Convertir primero a ARS si es necesario
    let amountInARS = amount
    if (from === "USD") {
      amountInARS = amount * exchangeRates.USD
    } else if (from === "USD_BLUE") {
      amountInARS = amount * exchangeRates.USD_BLUE
    }

    // Luego convertir de ARS a la moneda destino
    if (to === "ARS") {
      return amountInARS
    } else if (to === "USD") {
      return amountInARS / exchangeRates.USD
    } else if (to === "USD_BLUE") {
      return amountInARS / exchangeRates.USD_BLUE
    }

    return amount
  }

  // Función para formatear montos según la moneda seleccionada
  const formatCurrency = (amount: number): string => {
    const convertedAmount = convertAmount(amount, "ARS", currency)

    const options: Intl.NumberFormatOptions = {
      style: "currency",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }

    switch (currency) {
      case "ARS":
        options.currency = "ARS"
        break
      case "USD":
      case "USD_BLUE":
        options.currency = "USD"
        break
    }

    return new Intl.NumberFormat("es-AR", options).format(convertedAmount)
  }

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        exchangeRates,
        isLoading,
        error,
        formatCurrency,
        convertAmount,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}

// Hook para usar el contexto
export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider")
  }
  return context
}
