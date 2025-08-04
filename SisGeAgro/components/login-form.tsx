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
      toast({ title: "Error", description: "Email inválido", type: "error" })
      return
    }

    if (!email || !password) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        type: "error",
      })
      return
    }

    try {
      setIsLoading(true)

      const { data: userRecords, error: userError } = await supabase
        .from("users")
        .select("id, email, role, type")
        .eq("email", email)

      if (userError || !userRecords || userRecords.length === 0) {
        toast({
          title: "Usuario no encontrado",
          description: "Este correo no está registrado",
          type: "error",
        })
        return
      }

      const user = userRecords[0]

      if (user.type === "local") {
        // Guardar sesión en localStorage
        localStorage.setItem("user_id", user.id)

        toast({
          title: "Inicio de sesión interno",
          description: `Bienvenido/a, ${user.email}`,
        })

        if (user.role === "admin") {
          router.push("/dashboard")
        } else {
          router.push("/user-movement")
        }

        return
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        const message = authError.message.includes("Email not confirmed")
          ? "Tu email no ha sido confirmado. Contactá al administrador."
          : "Email o contraseña incorrectos."

        toast({
          title: "Error de autenticación",
          description: message,
          type: "error",
        })
        return
      }

      toast({ title: "Inicio de sesión exitoso", description: `Bienvenido/a` })

      if (user.role === "admin") {
        router.push("/dashboard")
      } else {
        router.push("/user-movement")
      }
    } catch (err: any) {
      console.error("Error general en login:", err)
      toast({
        title: "Error",
        description: err.message || "Error desconocido",
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
