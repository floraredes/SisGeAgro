"use client"

import { useState } from "react"
import { MainNavigation } from "@/components/main-navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserProfileSettings } from "@/components/settings/user-profile-settings"
import { NotificationSettings } from "@/components/settings/notification-settings"
import { UserManagementSettings } from "@/components/settings/user-management-settings"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BellIcon, SearchIcon } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile")

  return (
    <div className="flex min-h-screen">
      <MainNavigation />

      <div className="flex-1 flex flex-col">
        <header className="flex h-16 items-center justify-between border-b px-6">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="flex items-center gap-2 w-full max-w-[500px] bg-[#F5F6FA] rounded-full px-4 py-1.5">
              <SearchIcon className="h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search"
                className="border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <BellIcon className="h-6 w-6 text-muted-foreground" />
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500">
                5
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>MR</AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium">Admin User</p>
                <p className="text-xs text-muted-foreground">Admin</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 bg-[#F5F6FA] overflow-auto">
          <Card className="p-6 shadow-lg border-none">
            <h2 className="text-2xl font-bold mb-6">Configuración</h2>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 mb-8">
                <TabsTrigger value="profile">Datos del Usuario</TabsTrigger>
                <TabsTrigger value="notifications">Configurar Alertas</TabsTrigger>
                <TabsTrigger value="permissions">Permisos de Acceso</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="mt-6">
                <UserProfileSettings />
              </TabsContent>

              <TabsContent value="notifications" className="mt-6">
                <NotificationSettings />
              </TabsContent>

              <TabsContent value="permissions" className="mt-6">
                <UserManagementSettings />
              </TabsContent>
            </Tabs>
          </Card>
        </main>
      </div>
    </div>
  )
}
