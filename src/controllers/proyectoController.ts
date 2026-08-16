import type { Request, Response } from "express";
import { prisma } from "../models/db.ts";
import { validarProyecto } from "../validar.ts";

// --- CRUD proyectos (vistas; lectura pública, escritura solo del creador) ---

export async function listarProyectos(_req: Request, res: Response) {
  const proyectos = await prisma.proyecto.findMany({
    include: { creador: { select: { nombre: true, apellido: true } } },
    orderBy: { id: "desc" },
  });
  res.render("proyectos/lista", { title: "Proyectos", proyectos });
}

export function formNuevo(_req: Request, res: Response) {
  res.render("proyectos/form", { title: "Nuevo proyecto", action: "/proyectos" });
}

export async function crearProyecto(req: Request, res: Response) {
  const datos = validarProyecto(req.body);
  if (!datos) {
    return res.status(422).render("proyectos/form", { title: "Nuevo proyecto", action: "/proyectos", error: "Revisa los datos del proyecto.", proyecto: req.body });
  }
  await prisma.proyecto.create({ data: { ...datos, createdById: res.locals["usuario"].id } });
  res.redirect("/proyectos");
}

export async function formEditar(req: Request, res: Response) {
  const proyecto = await prisma.proyecto.findUnique({ where: { id: Number(req.params.id) } });
  if (!proyecto) return res.redirect("/proyectos");
  if (proyecto.createdById !== res.locals["usuario"].id) {
    return res.status(403).send("Solo el creador puede editar este proyecto.");
  }
  res.render("proyectos/form", { title: "Editar proyecto", action: `/proyectos/${proyecto.id}/editar`, proyecto });
}

export async function actualizarProyecto(req: Request, res: Response) {
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
}

export async function eliminarProyecto(req: Request, res: Response) {
  const id = Number(req.params.id);
  const proyecto = await prisma.proyecto.findUnique({ where: { id } });
  if (!proyecto) return res.redirect("/proyectos");
  if (proyecto.createdById !== res.locals["usuario"].id) {
    return res.status(403).send("Solo el creador puede eliminar este proyecto.");
  }
  await prisma.proyecto.delete({ where: { id } });
  res.redirect("/proyectos");
}
