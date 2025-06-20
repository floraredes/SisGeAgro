"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PlusIcon, Trash2Icon, PencilIcon } from "lucide-react"
import { supabase } from "@/lib/supabase/supabaseClient"
import { useToast } from "@/components/ui/simple-toast"

interface User {
  id: string
  email: string
  username: string
  role: string
  created_at: string
  last_sign_in_at: string | null
}

export function UserManagementSettings() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [isDeleteUserOpen, setIsDeleteUserOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const [newUser, setNewUser] = useState({
    email: "",
    username: "",
    password: "",
    role: "user",
  })

  useEffect(() => {
    loadUsers()
  }, [])

  // Reemplazar la función loadUsers con esta versión que no usa la API de administración
  async function loadUsers() {
    try {
      setLoading(true)

      // Obtener el usuario actual para verificar si es admin
      const {
        data: { user: currentUser },
        error: currentUserError,
      } = await supabase.auth.getUser()

      if (currentUserError) {
        throw currentUserError
      }

      // Verificar si el usuario actual existe en la tabla users
      let { data: currentProfile, error: currentProfileError } = await supabase
        .from("users")
        .select("role, type")
        .eq("id", currentUser?.id)

      if (!currentProfile || currentProfile.length === 0 || currentProfile[0].role !== "admin") {
        toast({
          title: "Acceso restringido",
          description: "Solo los administradores pueden gestionar usuarios",
          type: "error",
        })
        setUsers([])
        return
      }

      // Obtener todos los usuarios de la tabla users
      const { data: usersData, error: usersError } = await supabase.from("users").select("*")

      if (usersError) {
        throw usersError
      }

      // Formatear los datos para el componente
      const formattedUsers = usersData.map((user) => ({
        id: user.id,
        email: user.email || "",
        username: user.username || "",
        role: user.role || "user",
        created_at: user.created_at || "",
        last_sign_in_at: null,
      }))

      setUsers(formattedUsers)
    } catch (error) {
      console.error("Error loading users:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        type: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  // Reemplazar la función handleAddUser con esta versión mejorada
const handleAddUser = async (e: React.FormEvent) => {
  e.preventDefault()

  try {
    // Verificar la sesión actual
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError

    if (!sessionData.session) {
      toast({
        title: "Sesión expirada",
        description: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
        type: "error",
      })
      window.location.href = "/auth"
      return
    }

    const {
      data: { user: currentUser },
      error: currentUserError,
    } = await supabase.auth.getUser()

    if (currentUserError || !currentUser) {
      const { error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError) {
        toast({
          title: "Error de autenticación",
          description: "No se pudo verificar tu identidad. Por favor, inicia sesión nuevamente.",
          type: "error",
        })
        window.location.href = "/auth"
        return
      }

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()
      if (error || !user) {
        throw error || new Error("No se pudo obtener la información del usuario")
      }
    }

    // Verificar si es admin
    const { data: currentProfile, error: currentProfileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUser?.id)
      .single()

    if (currentProfileError) throw currentProfileError

    if (currentProfile?.role !== "admin") {
      toast({
        title: "Acceso restringido",
        description: "Solo los administradores pueden crear usuarios",
        type: "error",
      })
      return
    }

    // ✅ Usar API propia para crear el usuario
    const response = await fetch("/api/create-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: newUser.email,
        password: newUser.password,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || "Error al crear el usuario")
    }

    const createdUser = result.user

    if (createdUser?.id) {
      // Agregar perfil en tabla "users"
      const { error: profileError } = await supabase.from("users").insert({
        id: createdUser.id,
        username: newUser.username,
        role: newUser.role,
        email: newUser.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (profileError) {
        throw profileError
      }

      toast({
        title: "Usuario creado",
        description: "El usuario ha sido creado exitosamente",
      })

      setNewUser({
        email: "",
        username: "",
        password: "",
        role: "user",
      })
      setIsAddUserOpen(false)
      loadUsers()
    }
  } catch (error: any) {
    console.error("Error creating user:", error)
    toast({
      title: "Error",
      description: error.message || "No se pudo crear el usuario",
      type: "error",
    })
  }
}


  // Reemplazar la función handleEditUser con esta versión
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedUser) return

    try {
      // Verificar si el usuario actual es admin
      const {
        data: { user: currentUser },
        error: currentUserError,
      } = await supabase.auth.getUser()

      if (currentUserError) {
        throw currentUserError
      }

      // Primero verificar si el usuario actual existe en la tabla users
      let { data: currentProfile, error: currentProfileError } = await supabase
        .from("users")
        .select("role")
        .eq("id", currentUser?.id)
        .single()

      // Si el usuario no existe en la tabla users, crearlo automáticamente como admin
      if (currentProfileError && currentProfileError.code === "PGRST116") {
        // El usuario no existe en la tabla users, crearlo
        const { data: newProfile, error: insertError } = await supabase
          .from("users")
          .insert({
            id: currentUser?.id,
            username: currentUser?.email?.split("@")[0] || "admin",
            email: currentUser?.email,
            role: "admin", // El primer usuario será admin
          })
          .select()
          .single()

        if (insertError) {
          throw insertError
        }

        currentProfile = newProfile
      } else if (currentProfileError) {
        throw currentProfileError
      }

      // Si no es admin, mostrar mensaje y terminar
      if (currentProfile?.role !== "admin") {
        toast({
          title: "Acceso restringido",
          description: "Solo los administradores pueden editar usuarios",
          type: "error",
        })
        return
      }

      // Actualizar perfil de usuario
      const { error } = await supabase
        .from("users")
        .update({
          username: selectedUser.username,
          role: selectedUser.role,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedUser.id)

      if (error) {
        throw error
      }

      toast({
        title: "Usuario actualizado",
        description: "El usuario ha sido actualizado exitosamente",
      })

      setIsEditUserOpen(false)
      loadUsers()
    } catch (error: any) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el usuario",
        type: "error",
      })
    }
  }

  // Reemplazar la función handleDeleteUser con esta versión
  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      // Verificar si el usuario actual es admin
      const {
        data: { user: currentUser },
        error: currentUserError,
      } = await supabase.auth.getUser()

      if (currentUserError) {
        throw currentUserError
      }

      // Primero verificar si el usuario actual existe en la tabla users
      let { data: currentProfile, error: currentProfileError } = await supabase
        .from("users")
        .select("role")
        .eq("id", currentUser?.id)
        .single()

      // Si el usuario no existe en la tabla users, crearlo automáticamente como admin
      if (currentProfileError && currentProfileError.code === "PGRST116") {
        // El usuario no existe en la tabla users, crearlo
        const { data: newProfile, error: insertError } = await supabase
          .from("users")
          .insert({
            id: currentUser?.id,
            username: currentUser?.email?.split("@")[0] || "admin",
            email: currentUser?.email,
            role: "admin", // El primer usuario será admin
          })
          .select()
          .single()

        if (insertError) {
          throw insertError
        }

        currentProfile = newProfile
      } else if (currentProfileError) {
        throw currentProfileError
      }

      // Si no es admin, mostrar mensaje y terminar
      if (currentProfile?.role !== "admin") {
        toast({
          title: "Acceso restringido",
          description: "Solo los administradores pueden eliminar usuarios",
          type: "error",
        })
        return
      }

      // Eliminar perfil de usuario (la eliminación en cascada se encargará de auth.users)
      const { error: profileError } = await supabase.from("users").delete().eq("id", selectedUser.id)

      if (profileError) {
        throw profileError
      }

      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado exitosamente",
      })

      setIsDeleteUserOpen(false)
      loadUsers()
    } catch (error: any) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el usuario",
        type: "error",
      })
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="w-8 h-8 border-4 border-t-[#4F7942] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Gestión de Usuarios</CardTitle>
              <CardDescription>Administra los usuarios que tienen acceso al sistema</CardDescription>
            </div>
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <PlusIcon className="h-4 w-4" />
                  <span>Agregar Usuario</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Agregar Nuevo Usuario</DialogTitle>
                  <DialogDescription>Crea una nueva cuenta de usuario con permisos específicos</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleAddUser} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="correo@ejemplo.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Nombre de usuario</Label>
                    <Input
                      id="username"
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      placeholder="Nombre de usuario"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Rol</Label>
                    <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="user">Usuario</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <DialogFooter className="pt-4">
                    <Button type="submit">Crear Usuario</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center">
              <Input
                placeholder="Buscar usuarios..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Fecha de creación</TableHead>
                    <TableHead>Último acceso</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        No se encontraron usuarios
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username || "Sin nombre"}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                            {user.role === "admin" ? "Administrador" : "Usuario"}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : "Nunca"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedUser(user)
                                setIsEditUserOpen(true)
                              }}
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedUser(user)
                                setIsDeleteUserOpen(true)
                              }}
                            >
                              <Trash2Icon className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>Modifica los detalles y permisos del usuario</DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <form onSubmit={handleEditUser} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Correo electrónico</Label>
                <Input id="edit-email" type="email" value={selectedUser.email} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">El correo electrónico no se puede cambiar</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-username">Nombre de usuario</Label>
                <Input
                  id="edit-username"
                  value={selectedUser.username}
                  onChange={(e) => setSelectedUser({ ...selectedUser, username: e.target.value })}
                  placeholder="Nombre de usuario"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-role">Rol</Label>
                <Select
                  value={selectedUser.role}
                  onValueChange={(value) => setSelectedUser({ ...selectedUser, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="user">Usuario</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="pt-4">
                <Button type="submit">Guardar Cambios</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteUserOpen} onOpenChange={setIsDeleteUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Usuario</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="py-4">
              <div className="space-y-2 mb-4">
                <p>
                  <strong>Nombre:</strong> {selectedUser.username}
                </p>
                <p>
                  <strong>Email:</strong> {selectedUser.email}
                </p>
                <p>
                  <strong>Rol:</strong> {selectedUser.role === "admin" ? "Administrador" : "Usuario"}
                </p>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteUserOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleDeleteUser}>
                  Eliminar Usuario
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
