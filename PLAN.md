# PLAN: Auth (Argon2 + JWT) y CRUD de Proyectos

## Contexto

Prisma 7 + SQLite ya configurados (`src/db.ts` exporta `prisma`), modelos `Usuario` y `Proyecto` migrados. No se toca el schema: `Usuario.password` guarda el hash PHC y `Proyecto.createdById` da la ownership.

## Decisiones técnicas

- **`argon2`** (ranisalt/node-argon2): argon2id por defecto, binarios precompilados para Windows. API: `argon2.hash(pw)` / `argon2.verify(hash, pw)`.
- **`jsonwebtoken`** + `@types/jsonwebtoken`: `jwt.sign({ sub }, secret, { expiresIn: "7d" })` / `jwt.verify`.
- **JWT en cookie httpOnly + SameSite=Lax** (no Authorization header): las vistas Handlebars navegan con browser y necesitan auth en cada request. La API acepta cookie o `Bearer`.
- **`cookie-parser`** para leer la cookie; `express.urlencoded` para los forms (aún no está en `app.ts`).
- **`res.locals.usuario`**: el middleware deja ahí el usuario; Handlebars lo ve gratis (navbar) y los handlers lo leen sin augmentar tipos de Express.
- Forms HTML solo hacen GET/POST → edición/borrado por `POST /proyectos/:id/editar` y `POST /proyectos/:id/eliminar`. Sin method-override.
- `fechaInicio` con `<input type="date">` nativo; validación manual (required, correo único, monto numérico). Sin librería de validación.

## Diseño frontend (obligatorio antes de escribir vistas)

Toda vista (fases 3, 4 y 6) se implementa siguiendo `FRONTEND-DESIGN.md`: nada de Inter/Roboto/Arial, nada de gradientes azul-morado, nada de tarjetas blancas flotantes con sombra suave. Diseño ad hoc para un **gestor de proyectos de marketing**, fijado de antemano:

- **Audiencia y tono**: equipos de marketing y freelancers gestionando campañas; tono editorial, directo y profesional.
- **Tipografía** (Google Fonts por CDN): encabezados **Fraunces** (serif editorial con carácter), cuerpo **Space Grotesk** (grotesca moderna). Micro-etiquetas en mayúsculas con letter-spacing.
- **Color** (variables CSS en `main.handlebars`, sin hex sueltos en las vistas): `--paper` (blanco cálido), `--ink` (casi negro), `--accent` (naranja señal, energía de marketing), `--muted`, `--line` (hairlines).
- **Estructura**: Swiss/Editorial minimalista — hairlines de 1px, listado de proyectos como tabla/filas con divisores (no tarjetas), numeración visible, badges de estado con borde. Motion solo para feedback de interacción.
- Restricción del repo: sin pipeline de assets → los estilos custom van en un bloque `<style>` del layout sobre Bootstrap CDN (Bootstrap solo para grid y utilidades).

## Fases

### 1. Setup

- `npm i argon2 jsonwebtoken cookie-parser` + `npm i -D @types/jsonwebtoken @types/cookie-parser`.
- `.env`: `JWT_SECRET` (además del `DATABASE_URL` existente).
- `app.ts`: `app.use(express.urlencoded({ extended: false }))` y `app.use(cookieParser())` antes de los routers.

### 2. `src/auth.ts` (único archivo nuevo de lógica)

- `hashPassword(pw)` / `verifyPassword(hash, pw)` (wrappers de argon2).
- `signToken(userId)` y `setAuthCookie(res, token)` / `clearAuthCookie(res)`.
- `loadUser`: middleware global que verifica la cookie y setea `res.locals.usuario` (o null). No bloquea.
- `requireAuthView`: sin usuario → redirect `/login`. `requireAuthApi`: → 401 JSON.

### 3. Registro y login (vistas, en `routes/index.ts`)

- `GET /registro`, `GET /login` → forms Bootstrap (`registro.handlebars`, `login.handlebars`), re-render con error si falla.
- `POST /registro`: validar campos → correo único (Prisma P2002 o check previo) → hash → crear → cookie → redirect `/`.
- `POST /login`: buscar por correo → `argon2.verify` → cookie → redirect `/`. Mensaje genérico "credenciales inválidas".
- `POST /logout`: `clearCookie` → redirect `/`.

### 4. CRUD proyectos — vistas (`routes/index.ts`)

- `GET /proyectos`: listado público con nombre del creador (`include: { creador: true }`). Botones editar/eliminar solo si `usuario.id === proyecto.createdById`.
- `GET /proyectos/nuevo` + `POST /proyectos` (`requireAuthView`).
- `GET /proyectos/:id/editar` + `POST /proyectos/:id/editar` y `POST /proyectos/:id/eliminar` (`requireAuthView` + check `createdById === usuario.id`, si no 403).
- Vistas: `proyectos/lista.handlebars`, `proyectos/form.handlebars` (compartido nuevo/editar).

### 5. API (`routes/api.ts`)

- `POST /api/auth/register`, `POST /api/auth/login` → JSON + cookie.
- `GET /api/proyectos` y `GET /api/proyectos/:id` públicos; `POST`/`PUT`/`DELETE /api/proyectos[/:id]` con `requireAuthApi` + ownership (404 si no existe, 403 si no es dueño).

### 6. Layout y home

- Navbar en `main.handlebars`: marca + "Proyectos"; si `usuario`: saludo + logout (form POST); si no: Login/Registro. Home con CTAs.
- Aquí se materializa el diseño: Google Fonts, variables CSS y bloque `<style>` en el layout; navbar y home siguen la línea Swiss/Editorial definida arriba.

### 7. Verificación

- `npm run typecheck` limpio; flujo manual end-to-end: registro → login → crear → editar/eliminar propio OK, ajeno 403 → logout; `curl /api/health` y endpoints API.

## Omitido (YAGNI)

Refresh tokens, CSRF tokens (SameSite=Lax cubre los forms), rehash de contraseñas, paginación del listado. Agregar cuando haya necesidad real.
