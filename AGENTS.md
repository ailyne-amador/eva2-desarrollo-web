# AGENTS.md — Contexto del proyecto

## Qué es
Gestor de proyectos de marketing (ver `BRIEF.md`): app web MVC en Node.js + TypeScript + Express, vistas Handlebars con Bootstrap. Usuarios se registran y publican/editan/eliminan sus propios proyectos; la lectura es pública. Solo el creador (`created_by`) modifica su proyecto.

Modelos: Usuario (id, nombre, apellido, correo único, password hasheada con Argon2), Proyecto (id, nombre, descripcion, fechaInicio, estado, monto en CLP entero, created_by).

## Estado actual
Persistencia: **Prisma ORM 7 + SQLite** (`dev.db` en raíz, vía driver adapter `@prisma/adapter-better-sqlite3`). Cliente singleton en `src/models/db.ts` (`export const prisma`); cliente generado en `src/generated/prisma` (gitignored, regenerar con `npx prisma generate`). **Auth implementada**: registro/login/logout con Argon2 + JWT en cookie httpOnly SameSite=Lax (`src/auth.ts`: `loadUser` deja el usuario en `res.locals.usuario`, `requireAuthView` redirige a /login, `requireAuthApi` da 401). **CRUD de proyectos** en vistas y API: lectura pública, creación autenticada, edición/eliminación solo del creador (403 si no).

## Decisiones técnicas (respetar)
- **Node 24 ejecuta TypeScript nativamente** (type stripping). No hay tsx/ts-node ni paso de build. Consecuencias:
  - Imports entre archivos llevan extensión `.ts` explícita (`import { x } from "./routes/api.ts"`).
  - No usar enums ni namespaces de TS (type stripping no los soporta).
  - `"type": "module"` en package.json: ESM, nada de `require`.
- **TypeScript solo como typechecker (sujeto a cambio cuando el proyecto crezca)**: `npm run typecheck` (`tsc --noEmit`).
- **Express 5** + **express-handlebars**. Vistas en `src/views`, layout `layouts/main.handlebars`.
- **Bootstrap por CDN** en el layout. No hay assets propios ni pipeline de frontend.
- **Prisma ORM 7 + SQLite**. Particularidades de v7 (no aplicar guías de v6):
  - Requiere driver adapter: `@prisma/adapter-better-sqlite3`, export `PrismaBetterSqlite3` (minúsculas).
  - Generador `prisma-client` (TS plano) con output en `src/generated/prisma`; se importa desde `src/models/db.ts`.
  - `prisma.config.ts` obligatorio; carga `.env` vía `import "dotenv/config"` (v7 no lo hace solo).
  - `npx prisma migrate dev` **no** regenera el cliente: correr `npx prisma generate` después.
  - `DATABASE_URL="file:./dev.db"` se resuelve relativo a la raíz → ejecutar siempre desde la raíz (los scripts npm lo hacen).
- **tsconfig**: `"types": ["node"]` explícito e `include: ["src", "prisma.config.ts"]` (sin esto, el editor no resuelve `process` en el config de Prisma).
- **npm**: política allowScripts activa; los install scripts de `argon2`, `better-sqlite3`, `prisma` y `@prisma/engines` ya están aprobados.

## Estructura (MVC)
```
src/app.ts            # bootstrap: handlebars engine (+helpers eq/fecha/clp), parsers, cookie-parser, loadUser, routers, PORT (default 3000)
src/auth.ts           # argon2 hash/verify, cookie JWT, loadUser, requireAuthView/requireAuthApi (middleware)
src/validar.ts        # validación de proyecto (compartida vistas/API); monto = CLP entero
src/models/db.ts      # singleton PrismaClient (adapter better-sqlite3, lee DATABASE_URL de .env) — capa de modelo
src/controllers/      # handlers de VISTAS: homeController, authController, proyectoController
src/controllers/api/  # handlers de API JSON: authController, proyectoController
src/routes/index.ts   # viewRoutes — solo cablea rutas de VISTAS a controllers, en root
src/routes/api.ts     # apiRoutes — cablea rutas de API a controllers (/api/auth/*, /api/proyectos/*); /health va inline
src/views/            # layouts/main.handlebars (estilos inline), home, registro, login, proyectos/{lista,form}
prisma/schema.prisma  # modelos Usuario/Proyecto
prisma.config.ts      # v7: datasource url + dotenv; DATABASE_URL="file:./dev.db"
```

## Convención MVC (acordada con el usuario)
- **Rutas delgadas**: los routers solo declaran ruta → middleware → controller; la lógica vive en `src/controllers`.
- Vistas → root, en `src/routes/index.ts` (export `viewRoutes`) con controllers en `src/controllers/`.
- API → detrás de `/api`, en `src/routes/api.ts` (export `apiRoutes`) con controllers en `src/controllers/api/`.
- Montaje en `app.ts`: `app.use(viewRoutes); app.use("/api", apiRoutes)`.
- Nuevas rutas van en el archivo que corresponda; no mezclar. Lógica nueva → controller correspondiente, no en el router.
- Modelo: `prisma/schema.prisma` define Usuario/Proyecto; acceso siempre vía `src/models/db.ts`.

## Comandos
- `npm run dev` — `node --watch src/app.ts` (auto-reload en cambios de código).
- `npm start` — `node src/app.ts` (sin watch: requiere reinicio ante cambios de código).
- `npm run typecheck` — verificar tipos; debe quedar limpio tras cada cambio.
- `npx prisma migrate dev --name <nombre>` — crear/aplicar migración tras cambiar `schema.prisma` (interactivo; en shell no interactivo: `npx prisma migrate diff --from-migrations prisma/migrations --to-schema prisma/schema.prisma --script -o <carpeta>/migration.sql` y luego `npx prisma migrate deploy`).
- `npx prisma generate` — regenerar el cliente en `src/generated/prisma` (necesario tras migrate).

## Notas operativas
- Puerto: `process.env.PORT` o 3000.
- `.env` requiere `DATABASE_URL` (Prisma) y `JWT_SECRET` (auth.ts falla al arrancar sin él).
- Las vistas Handlebars se re-renderizan por petición fuera de producción (NODE_ENV sin definir) → cambios en `.handlebars` no requieren reinicio; cambios en `.ts` sí (salvo con `--watch`).
- Verificación habitual tras cambios: typecheck + levantar server + `curl /` y `curl /api/health`.

## Flujo de trabajo con el usuario
- Responder en español.

## Pendiente
- Brief base completo. Posibles mejoras futuras: paginación del listado, refresh tokens, deploy.
