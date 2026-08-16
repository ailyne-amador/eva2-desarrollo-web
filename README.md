# eva2-desarrollo-web

Gestor de proyectos de marketing. App web MVC en Node.js + TypeScript + Express, con vistas Handlebars (Bootstrap por CDN) y API REST. Los usuarios se registran y publican/editan/eliminan sus propios proyectos; la lectura es pública y solo el creador (`created_by`) puede modificar su proyecto.

## Stack

- **Node 24** — ejecuta TypeScript nativamente (type stripping), sin paso de build
- **Express 5** + **express-handlebars** — vistas en `src/views`
- **Prisma + SQLite** (better-sqlite3) — persistencia
- **argon2** — hash de contraseñas
- **JWT en cookie** — sesión
- TypeScript solo como typechecker (`tsc --noEmit`)

## Requisitos

- Node.js 24+

## Instalación

```bash
git clone https://github.com/ailyne-amador/eva2-desarrollo-web
cd eva2-desarrollo-web
npm install
```

Crear `.env` en la raíz:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="cambia-esto"
```

Aplicar migraciones:

```bash
npx prisma migrate dev
```

## Uso

```bash
npm run dev        # node --watch src/app.ts (auto-reload)
npm start          # sin watch
npm run typecheck  # verificar tipos
```

Servidor en `http://localhost:3000` (o `PORT` en el entorno).

## Modelos

| Modelo | Campos |
|---|---|
| **Usuario** | id, nombre, apellido, correo (único), password (hash argon2) |
| **Proyecto** | id, nombre, descripcion, fechaInicio, estado (default `activo`), monto (CLP), created_by → Usuario |

## Rutas

### Vistas (`src/routes/index.ts`)

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/` | Público |
| GET/POST | `/registro` | Público |
| GET/POST | `/login` | Público |
| POST | `/logout` | Autenticado |
| GET | `/proyectos` | Público |
| GET | `/proyectos/nuevo` | Autenticado |
| POST | `/proyectos` | Autenticado |
| GET | `/proyectos/:id/editar` | Solo creador |
| POST | `/proyectos/:id/editar` | Solo creador |
| POST | `/proyectos/:id/eliminar` | Solo creador |

### API (`src/routes/api.ts`, prefijo `/api`)

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/health` | Público |
| POST | `/api/auth/register` | Público |
| POST | `/api/auth/login` | Público |
| GET | `/api/proyectos` | Público |
| GET | `/api/proyectos/:id` | Público |
| POST | `/api/proyectos` | Autenticado |
| PUT | `/api/proyectos/:id` | Solo creador |
| DELETE | `/api/proyectos/:id` | Solo creador |

## Estructura

```
src/
  app.ts                  # bootstrap: handlebars, middlewares, routers
  auth.ts                 # JWT: loadUser, requireAuthView, requireAuthApi
  validar.ts              # validación de formularios
  models/db.ts            # cliente Prisma
  controllers/            # controladores de vistas
    api/                  # controladores de API
  routes/
    index.ts              # viewRoutes (vistas, en root)
    api.ts                # apiRoutes (detrás de /api)
  views/                  # plantillas Handlebars (layout: layouts/main.handlebars)
prisma/
  schema.prisma           # modelos Usuario / Proyecto
  migrations/
```

## Notas

- ESM (`"type": "module"`); imports entre archivos con extensión `.ts` explícita.
- Sin enums ni namespaces de TS (type stripping no los soporta).
- Autorización por `created_by`: editar/eliminar verifica que el usuario autenticado sea el creador.
