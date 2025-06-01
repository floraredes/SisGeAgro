"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase } from "@/lib/supabase/supabaseClient"
import { useToast } from "@/components/ui/simple-toast"

type LoginFormProps = {}

export default function LoginForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return emailRegex.test(email)
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value
    setEmail(newEmail)

    if (!newEmail) {
      setEmailError(null)
      return
    }

    if (!validateEmail(newEmail)) {
      setEmailError("Por favor, ingresa un email válido (ejemplo@dominio.com)")
    } else {
      setEmailError(null)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateEmail(email)) {
      setError("Por favor, ingresa un email válido")
      toast({
        title: "Error",
        description: "Por favor, ingresa un email válido",
        type: "error",
      })
      return
    }

    if (!email || !password) {
      setError("Por favor, completa todos los campos")
      toast({
        title: "Error",
        description: "Por favor, completa todos los campos",
        type: "error",
      })
      return
    }

    try {
      setIsLoading(true)
      console.log("Intentando iniciar sesión con email:", email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Error de Supabase durante el login:", error)

        if (error.message.includes("Invalid login credentials")) {
          setError("Email o contraseña incorrectos. Por favor, verifica tus datos.")
          toast({
            title: "Error de autenticación",
            description: "Email o contraseña incorrectos. Por favor, verifica tus datos.",
            type: "error",
          })
          return
        }

        if (error.message.includes("Email not confirmed")) {
          setError("Tu email no ha sido confirmado. Por favor, contacta al administrador.")
          toast({
            title: "Email no confirmado",
            description: "Tu email no ha sido confirmado. Por favor, contacta al administrador.",
            type: "error",
          })
          return
        }

        throw error
      }

      console.log("Login exitoso, datos devueltos:", data)

      // Verificar si el usuario tiene un perfil, si no, crearlo
      if (data && data.user) {
        // Primero verificamos si ya existe un perfil
        const { data: profileData, error: profileCheckError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single()

        if (profileCheckError && profileCheckError.code !== "PGRST116") {
          // PGRST116 es el código para "no se encontró ningún registro"
          console.error("Error al verificar el perfil:", profileCheckError)
        }

        // Si no existe un perfil, lo creamos
        if (!profileData) {
          const { error: profileCreateError } = await supabase.from("profiles").insert([
            {
              id: data.user.id,
              email: email,
              created_at: new Date().toISOString(),
            },
          ])

          if (profileCreateError) {
            console.error("Error al crear el perfil del usuario:", profileCreateError)
            // No lanzamos error aquí para permitir que el usuario inicie sesión de todos modos
          }
        }
      }

      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido de nuevo",
      })

      // Asegurarse de que la redirección sea a /dashboard
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Error completo durante el login:", error)
      setError(error.message || "Ocurrió un error al iniciar sesión")
      toast({
        title: "Error al iniciar sesión",
        description: error.message || "Ocurrió un error al iniciar sesión",
        type: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const inputStyle = {
    height: "44px",
    padding: "0 16px",
    backgroundColor: "#f9f9f9",
    border: "1px solid #e2e2e2",
    borderRadius: "8px",
    width: "100%",
    fontSize: "14px",
    transition: "all 0.2s ease",
  }

  const errorInputStyle = {
    ...inputStyle,
    borderColor: "#D32F2F",
    backgroundColor: "#FFEBEE",
  }

  const buttonStyle = {
    width: "100%",
    height: "44px",
    backgroundColor: "#4F7942",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    marginTop: "16px",
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "8px" }}>Login to Account</h1>
        <p style={{ fontSize: "14px", color: "#666", marginTop: "0" }}>
          Please enter your email and password to continue
        </p>
      </div>

      {error && (
        <div
          style={{
            padding: "12px",
            backgroundColor: "#FFEBEE",
            border: "1px solid #FFCDD2",
            color: "#D32F2F",
            borderRadius: "8px",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label htmlFor="email" style={{ fontSize: "14px", fontWeight: 500 }}>
            Email address:
          </label>
          <input
            id="email"
            placeholder="default@example.com"
            type="email"
            style={emailError ? errorInputStyle : inputStyle}
            value={email}
            onChange={handleEmailChange}
            required
          />
          {emailError && <p style={{ color: "#D32F2F", fontSize: "12px", margin: "4px 0 0 0" }}>{emailError}</p>}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label htmlFor="password" style={{ fontSize: "14px", fontWeight: 500 }}>
              Password
            </label>
            <Link href="/forgot-password" style={{ fontSize: "14px", color: "#4F7942", textDecoration: "none" }}>
              Forget Password?
            </Link>
          </div>
          <div style={{ position: "relative" }}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              style={inputStyle}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#666",
              }}
            >
              {showPassword ? "Ocultar" : "Mostrar"}
            </button>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
          />
          <label htmlFor="remember" style={{ fontSize: "14px", fontWeight: 500 }}>
            Remember Password
          </label>
        </div>

        <button
          type="submit"
          style={{
            ...buttonStyle,
            backgroundColor: isLoading ? "#7fa575" : "#4F7942",
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
          disabled={isLoading}
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  )
}
