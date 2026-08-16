import { Router } from "express";
import { requireAuthView } from "../auth.ts";
import { home } from "../controllers/homeController.ts";
import { getLogin, getRegistro, logout, postLogin, postRegistro } from "../controllers/authController.ts";
import { actualizarProyecto, crearProyecto, eliminarProyecto, formEditar, formNuevo, listarProyectos } from "../controllers/proyectoController.ts";

export const viewRoutes = Router();

viewRoutes.get("/", home);

// --- Registro / login / logout ---

viewRoutes.get("/registro", getRegistro);
viewRoutes.post("/registro", postRegistro);
viewRoutes.get("/login", getLogin);
viewRoutes.post("/login", postLogin);
viewRoutes.post("/logout", logout);

// --- CRUD proyectos (lectura pública, escritura solo del creador) ---

viewRoutes.get("/proyectos", listarProyectos);
viewRoutes.get("/proyectos/nuevo", requireAuthView, formNuevo);
viewRoutes.post("/proyectos", requireAuthView, crearProyecto);
viewRoutes.get("/proyectos/:id/editar", requireAuthView, formEditar);
viewRoutes.post("/proyectos/:id/editar", requireAuthView, actualizarProyecto);
viewRoutes.post("/proyectos/:id/eliminar", requireAuthView, eliminarProyecto);
