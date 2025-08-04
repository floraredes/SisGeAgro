"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus } from "lucide-react"
import { supabase } from "@/lib/supabase/supabaseClient"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Entity {
  id: string
  nombre: string
  cuit_cuil: string
}

interface EntitySelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectEntity: (entity: Entity) => void
  onCreateNewEntity: () => void
  user: any
}

export function EntitySelector({ open, onOpenChange, onSelectEntity, onCreateNewEntity, user }: EntitySelectorProps) {
  const [entities, setEntities] = useState<Entity[]>([])
  const [filteredEntities, setFilteredEntities] = useState<Entity[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isAdmin = user?.role === "admin"
  const isInternal = user?.type === "local"

  // Cargar entidades al abrir el modal
  useEffect(() => {
    if (open) {
      fetchEntities()
    }
  }, [open])

  // Filtrar entidades cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredEntities(entities)
    } else {
      const filtered = entities.filter(
        (entity) =>
          entity.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || entity.cuit_cuil.includes(searchTerm),
      )
      setFilteredEntities(filtered)
    }
  }, [searchTerm, entities])

  const fetchEntities = async () => {
    setLoading(true)
    setError(null)
    try { 
      console.log('🔄 [EntitySelector] Fetching entities...');
      // Siempre usar la API para tener permisos completos
      const res = await fetch('/api/entities');
      if (res.ok) {
        const json = await res.json();
        console.log('✅ [EntitySelector] Entities loaded from API:', json.entities);
        setEntities(json.entities || []);
      } else {
        console.error('❌ [EntitySelector] Error en fetchEntities - Status:', res.status);
        const errorText = await res.text();
        console.error('❌ [EntitySelector] Error response:', errorText);
        setError('Error al cargar entidades');
      }
    } catch (err: any) {
      console.error('❌ [EntitySelector] Error fetching entities:', err);
      setError(err.message || "Error al cargar entidades");
    } finally {
      setLoading(false);
    }
  }

  const handleSelectEntity = (entity: Entity) => {
    onSelectEntity(entity)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Seleccionar Entidad</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Barra de búsqueda */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o CUIT/CUIL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Lista de entidades */}
          <div className="border rounded-md">
            <ScrollArea className="h-[300px]">
              {loading ? (
                <div className="flex items-center justify-center h-full p-4">
                  <div className="w-6 h-6 border-2 border-t-[#4F7942] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                  <span className="ml-2">Cargando entidades...</span>
                </div>
              ) : error ? (
                <div className="p-4 text-center text-red-500">{error}</div>
              ) : filteredEntities.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No se encontraron entidades. ¿Desea crear una nueva?
                </div>
              ) : (
                <div className="divide-y">
                  {filteredEntities.map((entity) => (
                    <div
                      key={entity.id}
                      className="p-3 hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => handleSelectEntity(entity)}
                    >
                      <div className="font-medium">{entity.nombre}</div>
                      <div className="text-sm text-muted-foreground">CUIT/CUIL: {entity.cuit_cuil}</div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Botón para crear nueva entidad */}
          <div className="flex justify-end">
            <Button onClick={onCreateNewEntity} className="flex items-center justify-center gap-2" variant="outline">
              <Plus className="h-4 w-4" />
              Crear nueva entidad
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

