import type { Request, Response } from "express";
import { prisma } from "../models/db.ts";
import { clearAuthCookie, hashPassword, setAuthCookie, verifyPassword } from "../auth.ts";

// --- Registro / login / logout (vistas) ---

export function getRegistro(_req: Request, res: Response) {
  res.render("registro", { title: "Crear cuenta" });
}

export async function postRegistro(req: Request, res: Response) {
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
}

export function getLogin(_req: Request, res: Response) {
  res.render("login", { title: "Ingresar" });
}

export async function postLogin(req: Request, res: Response) {
  const { password = "" } = req.body;
  const correo = String(req.body.correo ?? "").trim().toLowerCase();
  const usuario = await prisma.usuario.findUnique({ where: { correo } });
  if (!usuario || !(await verifyPassword(usuario.password, password))) {
    return res.status(422).render("login", { title: "Ingresar", error: "Credenciales inválidas.", correo });
  }
  setAuthCookie(res, usuario.id);
  res.redirect("/proyectos");
}

export function logout(_req: Request, res: Response) {
  clearAuthCookie(res);
  res.redirect("/");
}
