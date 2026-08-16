-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Proyecto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL DEFAULT '',
    "fechaInicio" DATETIME NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "monto" INTEGER NOT NULL,
    "created_by" INTEGER NOT NULL,
    CONSTRAINT "Proyecto_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Proyecto" ("created_by", "estado", "fechaInicio", "id", "monto", "nombre") SELECT "created_by", "estado", "fechaInicio", "id", "monto", "nombre" FROM "Proyecto";
DROP TABLE "Proyecto";
ALTER TABLE "new_Proyecto" RENAME TO "Proyecto";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
