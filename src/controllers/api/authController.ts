import type { Request, Response } from "express";
import { prisma } from "../../models/db.ts";
import { hashPassword, setAuthCookie, verifyPassword } from "../../auth.ts";

// --- Auth (API JSON) ---

export async function register(req: Request, res: Response) {
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
}

export async function login(req: Request, res: Response) {
  const { password = "" } = req.body;
  const correo = String(req.body.correo ?? "").trim().toLowerCase();
  const usuario = await prisma.usuario.findUnique({ where: { correo } });
  if (!usuario || !(await verifyPassword(usuario.password, password))) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }
  setAuthCookie(res, usuario.id);
  res.json({ id: usuario.id, nombre: usuario.nombre, apellido: usuario.apellido, correo: usuario.correo });
}
