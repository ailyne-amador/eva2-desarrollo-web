import { Router } from "express";
import { prisma } from "../db.ts";
import { validarProyecto } from "../validar.ts";
import { hashPassword, requireAuthApi, setAuthCookie, verifyPassword } from "../auth.ts";

export const apiRoutes = Router();

apiRoutes.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// --- Auth ---

apiRoutes.post("/auth/register", async (req, res) => {
  const { nombre = "", apellido = "", password = "" } = req.body;
  const correo = String(req.body.correo ?? "").trim().toLowerCase();
  if (!nombre.trim() || !apellido.trim() || !correo || password.length < 6) {
    return res.status(422).json({ error: "Campos inválidos (contraseña de al menos 6 caracteres)" });
  }
  const existe = await prisma.usuario.findUnique({ where: { correo } });
  if (existe) return res.status(409).json({ error: "Correo ya registrado" });
  const usuario = await prisma.usuario.create({
    data: { nombre: nombre.trim(), apellido: apellido.trim(), correo, password: await hashPassword(password) },
    select: { id: true, nombre: true, apellido: true, correo: true },
  });
  setAuthCookie(res, usuario.id);
  res.status(201).json(usuario);
});

apiRoutes.post("/auth/login", async (req, res) => {
  const { password = "" } = req.body;
  const correo = String(req.body.correo ?? "").trim().toLowerCase();
  const usuario = await prisma.usuario.findUnique({ where: { correo } });
  if (!usuario || !(await verifyPassword(usuario.password, password))) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }
  setAuthCookie(res, usuario.id);
  res.json({ id: usuario.id, nombre: usuario.nombre, apellido: usuario.apellido, correo: usuario.correo });
});

// --- CRUD proyectos (lectura pública, escritura autenticada + dueño) ---

const CREADOR_SELECT = { select: { id: true, nombre: true, apellido: true } } as const;

apiRoutes.get("/proyectos", async (_req, res) => {
  res.json(await prisma.proyecto.findMany({ include: { creador: CREADOR_SELECT }, orderBy: { id: "desc" } }));
});

apiRoutes.get("/proyectos/:id", async (req, res) => {
  const proyecto = await prisma.proyecto.findUnique({
    where: { id: Number(req.params.id) },
    include: { creador: CREADOR_SELECT },
  });
  if (!proyecto) return res.status(404).json({ error: "No encontrado" });
  res.json(proyecto);
});

apiRoutes.post("/proyectos", requireAuthApi, async (req, res) => {
  const datos = validarProyecto(req.body);
  if (!datos) return res.status(422).json({ error: "Datos inválidos" });
  const proyecto = await prisma.proyecto.create({ data: { ...datos, createdById: res.locals["usuario"].id } });
  res.status(201).json(proyecto);
});

apiRoutes.put("/proyectos/:id", requireAuthApi, async (req, res) => {
  const id = Number(req.params.id);
  const proyecto = await prisma.proyecto.findUnique({ where: { id } });
  if (!proyecto) return res.status(404).json({ error: "No encontrado" });
  if (proyecto.createdById !== res.locals["usuario"].id) return res.status(403).json({ error: "Solo el creador puede editar" });
  const datos = validarProyecto(req.body);
  if (!datos) return res.status(422).json({ error: "Datos inválidos" });
  res.json(await prisma.proyecto.update({ where: { id }, data: datos }));
});

apiRoutes.delete("/proyectos/:id", requireAuthApi, async (req, res) => {
  const id = Number(req.params.id);
  const proyecto = await prisma.proyecto.findUnique({ where: { id } });
  if (!proyecto) return res.status(404).json({ error: "No encontrado" });
  if (proyecto.createdById !== res.locals["usuario"].id) return res.status(403).json({ error: "Solo el creador puede eliminar" });
  await prisma.proyecto.delete({ where: { id } });
  res.status(204).end();
});
