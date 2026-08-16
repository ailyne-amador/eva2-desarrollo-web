import express from "express";
import cookieParser from "cookie-parser";
import { engine } from "express-handlebars";
import { loadUser } from "./auth.ts";
import { viewRoutes } from "./routes/index.ts";
import { apiRoutes } from "./routes/api.ts";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.engine("handlebars", engine({
  helpers: {
    eq: (a: unknown, b: unknown) => a === b,
    fecha: (d: Date) => new Date(d).toISOString().slice(0, 10),
    clp: (n: number) => `$${new Intl.NumberFormat("es-CL").format(n)}`,
  },
}));
app.set("view engine", "handlebars");
app.set("views", "src/views");

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.use(loadUser);

app.use(viewRoutes);
app.use("/api", apiRoutes);

app.listen(port, () => console.log(`http://localhost:${port}`));
