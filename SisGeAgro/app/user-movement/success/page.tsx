"use client"

import { useRouter } from "next/navigation"

export default function UserMovementSuccess() {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("user_id")
    router.push("/auth")
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #e6eee0 0%, #4F7942 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Formas orgánicas */}
      <div style={{
        position: "absolute", top: "-20%", left: "-10%", width: "50%", height: "50%",
        borderRadius: "50%", background: "rgba(79, 121, 66, 0.2)", filter: "blur(60px)", zIndex: 0,
      }} />
      <div style={{
        position: "absolute", bottom: "-20%", right: "-10%", width: "60%", height: "60%",
        borderRadius: "50%", background: "rgba(79, 121, 66, 0.3)", filter: "blur(80px)", zIndex: 0,
      }} />
      <div style={{
        position: "absolute", top: "30%", right: "20%", width: "40%", height: "40%",
        borderRadius: "50%", background: "rgba(79, 121, 66, 0.15)", filter: "blur(50px)", zIndex: 0,
      }} />

      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "white",
          padding: "32px",
          borderRadius: "20px",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
          position: "relative",
          zIndex: 1,
          textAlign: "center",
        }}
      >
        <h2 className="text-2xl font-bold mb-4">¡Movimiento cargado con éxito!</h2>
        <p className="mb-6">¿Qué deseas hacer ahora?</p>
        <button
          className="w-full mb-3 py-2 px-4 bg-green-700 text-white rounded hover:bg-green-800 transition"
          onClick={() => router.push("/user-movement")}
        >
          Cargar otro movimiento
        </button>
        <button
          className="w-full py-2 px-4 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
          onClick={handleLogout}
        >
          Salir
        </button>
      </div>
    </div>
  )
}