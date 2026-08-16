import { Router } from "express";
import { prisma } from "../db.ts";
import { validarProyecto } from "../validar.ts";
import { clearAuthCookie, hashPassword, requireAuthView, setAuthCookie, verifyPassword } from "../auth.ts";

export const viewRoutes = Router();

viewRoutes.get("/", (_req, res) => {
  res.render("home", { title: "Gestor de proyectos de marketing" });
});

// --- Registro / login / logout ---

viewRoutes.get("/registro", (_req, res) => {
  res.render("registro", { title: "Crear cuenta" });
});

viewRoutes.post("/registro", async (req, res) => {
  const { nombre = "", apellido = "", password = "" } = req.body;
  const correo = String(req.body.correo ?? "").trim().toLowerCase();
  if (!nombre.trim() || !apellido.trim() || !correo || password.length < 6) {
    return res.status(422).render("registro", { title: "Crear cuenta", error: "Completa todos los campos (contraseña de al menos 6 caracteres).", nombre, apellido, correo });
  }
  const existe = await prisma.usuario.findUnique({ where: { correo } });
  if (existe) {
    return res.status(422).render("registro", { title: "Crear cuenta", error: "Ese correo ya está registrado.", nombre, apellido, correo });
  }
  const usuario = await prisma.usuario.create({
    data: { nombre: nombre.trim(), apellido: apellido.trim(), correo, password: await hashPassword(password) },
  });
  setAuthCookie(res, usuario.id);
  res.redirect("/proyectos");
});

viewRoutes.get("/login", (_req, res) => {
  res.render("login", { title: "Ingresar" });
});

viewRoutes.post("/login", async (req, res) => {
  const { password = "" } = req.body;
  const correo = String(req.body.correo ?? "").trim().toLowerCase();
  const usuario = await prisma.usuario.findUnique({ where: { correo } });
  if (!usuario || !(await verifyPassword(usuario.password, password))) {
    return res.status(422).render("login", { title: "Ingresar", error: "Credenciales inválidas.", correo });
  }
  setAuthCookie(res, usuario.id);
  res.redirect("/proyectos");
});

viewRoutes.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.redirect("/");
});

// --- CRUD proyectos (lectura pública, escritura solo del creador) ---

viewRoutes.get("/proyectos", async (_req, res) => {
  const proyectos = await prisma.proyecto.findMany({
    include: { creador: { select: { nombre: true, apellido: true } } },
    orderBy: { id: "desc" },
  });
  res.render("proyectos/lista", { title: "Proyectos", proyectos });
});

viewRoutes.get("/proyectos/nuevo", requireAuthView, (_req, res) => {
  res.render("proyectos/form", { title: "Nuevo proyecto", action: "/proyectos" });
});

viewRoutes.post("/proyectos", requireAuthView, async (req, res) => {
  const datos = validarProyecto(req.body);
  if (!datos) {
    return res.status(422).render("proyectos/form", { title: "Nuevo proyecto", action: "/proyectos", error: "Revisa los datos del proyecto.", proyecto: req.body });
  }
  await prisma.proyecto.create({ data: { ...datos, createdById: res.locals["usuario"].id } });
  res.redirect("/proyectos");
});

viewRoutes.get("/proyectos/:id/editar", requireAuthView, async (req, res) => {
  const proyecto = await prisma.proyecto.findUnique({ where: { id: Number(req.params.id) } });
  if (!proyecto) return res.redirect("/proyectos");
  if (proyecto.createdById !== res.locals["usuario"].id) {
    return res.status(403).send("Solo el creador puede editar este proyecto.");
  }
  res.render("proyectos/form", { title: "Editar proyecto", action: `/proyectos/${proyecto.id}/editar`, proyecto });
});

viewRoutes.post("/proyectos/:id/editar", requireAuthView, async (req, res) => {
  const id = Number(req.params.id);
  const proyecto = await prisma.proyecto.findUnique({ where: { id } });
  if (!proyecto) return res.redirect("/proyectos");
  if (proyecto.createdById !== res.locals["usuario"].id) {
    return res.status(403).send("Solo el creador puede editar este proyecto.");
  }
  const datos = validarProyecto(req.body);
  if (!datos) {
    return res.status(422).render("proyectos/form", { title: "Editar proyecto", action: `/proyectos/${id}/editar`, error: "Revisa los datos del proyecto.", proyecto: { ...req.body, id } });
  }
  await prisma.proyecto.update({ where: { id }, data: datos });
  res.redirect("/proyectos");
});

viewRoutes.post("/proyectos/:id/eliminar", requireAuthView, async (req, res) => {
  const id = Number(req.params.id);
  const proyecto = await prisma.proyecto.findUnique({ where: { id } });
  if (!proyecto) return res.redirect("/proyectos");
  if (proyecto.createdById !== res.locals["usuario"].id) {
    return res.status(403).send("Solo el creador puede eliminar este proyecto.");
  }
  await prisma.proyecto.delete({ where: { id } });
  res.redirect("/proyectos");
});
