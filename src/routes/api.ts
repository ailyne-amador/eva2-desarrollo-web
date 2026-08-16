import { Router } from "express";
import { requireAuthApi } from "../auth.ts";
import { login, register } from "../controllers/api/authController.ts";
import { actualizarProyecto, crearProyecto, eliminarProyecto, listarProyectos, obtenerProyecto } from "../controllers/api/proyectoController.ts";

export const apiRoutes = Router();

apiRoutes.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// --- Auth ---

apiRoutes.post("/auth/register", register);
apiRoutes.post("/auth/login", login);

// --- CRUD proyectos (lectura pública, escritura autenticada + dueño) ---

apiRoutes.get("/proyectos", listarProyectos);
apiRoutes.get("/proyectos/:id", obtenerProyecto);
apiRoutes.post("/proyectos", requireAuthApi, crearProyecto);
apiRoutes.put("/proyectos/:id", requireAuthApi, actualizarProyecto);
apiRoutes.delete("/proyectos/:id", requireAuthApi, eliminarProyecto);
