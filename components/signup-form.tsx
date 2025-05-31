"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase } from "@/lib/supabase/supabaseClient"
import { useToast } from "@/components/ui/simple-toast" // Cambiamos a useToast en lugar de toast

interface SignupFormProps {
  onLogin: () => void
}

export default function SignupForm({ onLogin }: SignupFormProps) {
  const router = useRouter()
  const { toast } = useToast() // Obtenemos la función toast del hook useToast
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)

  // Función para validar el formato del email
  const validateEmail = (email: string): boolean => {
    // Expresión regular para validar emails
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return emailRegex.test(email)
  }

  // Manejador para cambios en el campo de email
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value
    setEmail(newEmail)

    // Limpiar el error si el campo está vacío
    if (!newEmail) {
      setEmailError(null)
      return
    }

    // Validar el formato del email cuando el usuario escribe
    if (!validateEmail(newEmail)) {
      setEmailError("Por favor, ingresa un email válido (ejemplo@dominio.com)")
    } else {
      setEmailError(null)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Validar el email antes de continuar
    if (!validateEmail(email)) {
      setError("Por favor, ingresa un email válido")
      toast({
        title: "Error",
        description: "Por favor, ingresa un email válido",
        variant: "destructive",
      })
      return
    }

    if (!email || !username || !password) {
      setError("Por favor, completa todos los campos")
      toast({
        title: "Error",
        description: "Por favor, completa todos los campos",
        variant: "destructive",
      })
      return
    }

    if (!acceptTerms) {
      setError("Debes aceptar los términos y condiciones")
      toast({
        title: "Error",
        description: "Debes aceptar los términos y condiciones",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)

      // Registrar usuario en Supabase
      console.log("Intentando registrar usuario con email:", email)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      })

      if (error) {
        console.error("Error de Supabase durante el registro:", error)
        throw error
      }

      console.log("Registro exitoso, datos devueltos:", data)

      // Verificar si el usuario se creó correctamente
      if (data && data.user) {
        // Crear un perfil para el usuario en la tabla profiles
        const { error: profileError } = await supabase.from("profiles").insert([
          {
            id: data.user.id, // Usar el ID del usuario como ID del perfil
            username: username,
            email: email,
            created_at: new Date().toISOString(),
          },
        ])

        if (profileError) {
          console.error("Error al crear el perfil del usuario:", profileError)
          throw profileError
        }

        setSuccess("Cuenta creada exitosamente. Ya puedes iniciar sesión.")
        toast({
          title: "Registro exitoso",
          description: "Cuenta creada exitosamente. Ya puedes iniciar sesión.",
        })
      } else {
        throw new Error("No se pudo crear la cuenta por un error desconocido")
      }
    } catch (error: any) {
      console.error("Error completo durante el registro:", error)
      setError(error.message || "Ocurrió un error al crear la cuenta")
      toast({
        title: "Error al registrarse",
        description: error.message || "Ocurrió un error al crear la cuenta",
        variant: "destructive",
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
        <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "8px" }}>Create an Account</h1>
        <p style={{ fontSize: "14px", color: "#666", marginTop: "0" }}>Create a account to continue</p>
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

      {success && (
        <div
          style={{
            padding: "12px",
            backgroundColor: "#E8F5E9",
            border: "1px solid #C8E6C9",
            color: "#2E7D32",
            borderRadius: "8px",
            fontSize: "14px",
          }}
        >
          {success}
        </div>
      )}

      <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label htmlFor="signup-email" style={{ fontSize: "14px", fontWeight: 500 }}>
            Email address:
          </label>
          <input
            id="signup-email"
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
          <label htmlFor="username" style={{ fontSize: "14px", fontWeight: 500 }}>
            Username
          </label>
          <input
            id="username"
            placeholder="Username"
            style={inputStyle}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label htmlFor="signup-password" style={{ fontSize: "14px", fontWeight: 500 }}>
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            style={inputStyle}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Checkbox
            id="terms"
            checked={acceptTerms}
            onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
          />
          <label htmlFor="terms" style={{ fontSize: "14px", fontWeight: 500 }}>
            I accept terms and conditions
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
          {isLoading ? "Creando cuenta..." : "Sign Up"}
        </button>

        <div style={{ textAlign: "center", fontSize: "14px", marginTop: "8px" }}>
          Already have an account?{" "}
          <button
            type="button"
            onClick={onLogin}
            style={{
              color: "#4F7942",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontWeight: 500,
              padding: 0,
            }}
          >
            Login
          </button>
        </div>
      </form>
    </div>
  )
}

