# SIS-GE-AGRO

Sistema de Gestión Económica para Agroempresas

---

## Descripción

SIS-GE-AGRO es una plataforma web para la gestión financiera y administrativa de empresas agropecuarias. Permite el registro, control y visualización de movimientos económicos, usuarios, entidades, impuestos y reportes estadísticos, con un enfoque en la facilidad de uso y la seguridad.

---

## Características principales

- Dashboard con estadísticas y gráficos de ingresos/egresos
- Gestión de usuarios y roles (admin, usuario)
- Registro y edición de movimientos económicos
- Gestión de entidades, categorías, subcategorías e impuestos
- Notificaciones y configuración de usuarios
- Importación de movimientos desde CSV
- Autenticación y autorización con Supabase
- Interfaz moderna con Next.js y Tailwind CSS

---

## Tecnologías utilizadas

- **Next.js** (App Router)
- **React**
- **TypeScript**
- **Supabase** (Auth, Database)
- **Tailwind CSS**
- **PostgreSQL**

---

## Instalación y ejecución local

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/sis-ge-agro.git
   cd sis-ge-agro
   ```
2. **Instala dependencias:**
   ```bash
   npm install
   # o
   yarn install
   ```
3. **Configura las variables de entorno:**
   - Crea un archivo `.env.local` y agrega:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
     SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
     NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
<<<<<<< HEAD
=======
     GMAIL_USER= your_gmail
     GMAIL_PASS= your_gmail_pass

>>>>>>> e5652f7169f0f0d9e2c1d13e32ef453e02fd5386
     ```
4. **Ejecuta el proyecto:**
   ```bash
   npm run dev
   # o
   yarn dev
   ```
5. Accede a `http://localhost:3000`

---

## Estructura del proyecto

```
components/
  ui/           # Componentes de UI reutilizables
  settings/     # Configuración y gestión de usuarios
  ...
app/
  dashboard/    # Dashboard y vistas principales
  api/          # Endpoints API (Next.js Route Handlers)
  ...
lib/            # Lógica de negocio y utilidades
contexts/       # Contextos globales de React
hooks/          # Hooks personalizados
public/         # Recursos estáticos
```

---

## Configuración de Supabase

- Crea un proyecto en [Supabase](https://supabase.com/)
- Configura las tablas `users`, `movements`, `entities`, `categories`, `taxes`, etc.
- Habilita la autenticación por email y configura las claves en `.env.local`

---

## Scripts útiles

- `npm run dev` — Ejecuta el servidor de desarrollo
- `npm run build` — Compila la app para producción
- `npm run start` — Inicia la app en modo producción

---

<<<<<<< HEAD
## Licencia

MIT

---

## Autor

- [Tu Nombre o Equipo](https://github.com/tu-usuario)
=======

>>>>>>> e5652f7169f0f0d9e2c1d13e32ef453e02fd5386
