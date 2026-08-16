const ESTADOS = ["activo", "pausado", "completado"];

// Valida el body de un formulario/JSON de proyecto. null = inválido.
// monto: pesos chilenos → entero sin decimales.
export function validarProyecto(body: Record<string, unknown>) {
  const nombre = String(body["nombre"] ?? "").trim();
  const descripcion = String(body["descripcion"] ?? "").trim();
  const fechaRaw = String(body["fechaInicio"] ?? "");
  const fechaInicio = new Date(fechaRaw);
  const monto = Number(body["monto"]);
  const estadoRaw = String(body["estado"] ?? "");
  if (!nombre || !descripcion || !fechaRaw || Number.isNaN(fechaInicio.getTime()) || !Number.isInteger(monto) || monto < 0) return null;
  return { nombre, descripcion, fechaInicio, monto, estado: ESTADOS.includes(estadoRaw) ? estadoRaw : "activo" };
}
