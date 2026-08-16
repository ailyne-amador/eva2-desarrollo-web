import argon2 from "argon2";
import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { prisma } from "./models/db.ts";

const JWT_SECRET = process.env["JWT_SECRET"]!;
const COOKIE = "token";

export const hashPassword = (password: string) => argon2.hash(password);
export const verifyPassword = (hash: string, password: string) => argon2.verify(hash, password);

export function setAuthCookie(res: Response, userId: number) {
  const token = jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "7d" });
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: "lax", maxAge: 7 * 24 * 60 * 60 * 1000 });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(COOKIE);
}

// Deja el usuario autenticado (o null) en res.locals.usuario: lo ven vistas y handlers.
export async function loadUser(req: Request, res: Response, next: NextFunction) {
  res.locals["usuario"] = null;
  const token = req.cookies?.[COOKIE] ?? req.headers.authorization?.replace(/^Bearer /, "");
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const id = typeof payload === "object" ? Number(payload.sub) : NaN;
      if (Number.isInteger(id)) {
        res.locals["usuario"] = await prisma.usuario.findUnique({
          where: { id },
          select: { id: true, nombre: true, apellido: true, correo: true },
        });
      }
    } catch {
      // token inválido o expirado → sigue como anónimo
    }
  }
  next();
}

export function requireAuthView(_req: Request, res: Response, next: NextFunction) {
  if (!res.locals["usuario"]) {
    res.redirect("/login");
    return;
  }
  next();
}

export function requireAuthApi(_req: Request, res: Response, next: NextFunction) {
  if (!res.locals["usuario"]) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }
  next();
}
