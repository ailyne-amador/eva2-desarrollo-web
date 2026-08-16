import type { Request, Response } from "express";
import { prisma } from "../../models/db.ts";
import { validarProyecto } from "../../validar.ts";

// --- CRUD proyectos (API JSON; lectura pública, escritura autenticada + dueño) ---

const CREADOR_SELECT = { select: { id: true, nombre: true, apellido: true } } as const;

export async function listarProyectos(_req: Request, res: Response) {
  res.json(await prisma.proyecto.findMany({ include: { creador: CREADOR_SELECT }, orderBy: { id: "desc" } }));
}

export async function obtenerProyecto(req: Request, res: Response) {
  const proyecto = await prisma.proyecto.findUnique({
    where: { id: Number(req.params.id) },
    include: { creador: CREADOR_SELECT },
  });
  if (!proyecto) return res.status(404).json({ error: "No encontrado" });
  res.json(proyecto);
}

export async function crearProyecto(req: Request, res: Response) {
  const datos = validarProyecto(req.body);
  if (!datos) return res.status(422).json({ error: "Datos inválidos" });
  const proyecto = await prisma.proyecto.create({ data: { ...datos, createdById: res.locals["usuario"].id } });
  res.status(201).json(proyecto);
}

export async function actualizarProyecto(req: Request, res: Response) {
  const id = Number(req.params.id);
  const proyecto = await prisma.proyecto.findUnique({ where: { id } });
  if (!proyecto) return res.status(404).json({ error: "No encontrado" });
  if (proyecto.createdById !== res.locals["usuario"].id) return res.status(403).json({ error: "Solo el creador puede editar" });
  const datos = validarProyecto(req.body);
  if (!datos) return res.status(422).json({ error: "Datos inválidos" });
  res.json(await prisma.proyecto.update({ where: { id }, data: datos }));
}

export async function eliminarProyecto(req: Request, res: Response) {
  const id = Number(req.params.id);
  const proyecto = await prisma.proyecto.findUnique({ where: { id } });
  if (!proyecto) return res.status(404).json({ error: "No encontrado" });
  if (proyecto.createdById !== res.locals["usuario"].id) return res.status(403).json({ error: "Solo el creador puede eliminar" });
  await prisma.proyecto.delete({ where: { id } });
  res.status(204).end();
}
