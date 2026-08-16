import type { Request, Response } from "express";

export function home(_req: Request, res: Response) {
  res.render("home", { title: "Gestor de proyectos de marketing" });
}
