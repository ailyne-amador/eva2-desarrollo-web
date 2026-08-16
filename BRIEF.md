# Gestor de proyectos de marketing

Aplicación web MVC para guardar y gestionar proyectos de marketing en la nube. 
Cada usuario puede registrarse, publicar, editar y eliminar sus propios proyectos. El sistema es público para lectura: otros usuarios pueden ver la lista de proyectos, pero solo el creador puede modificarlos.

## Modelos de diseño

Usuario
Id
Nombre
Apellido
Correo
Contraseña

Proyecto
Id
Nombre
Fecha de inicio
Estado
Monto (presupuesto)
created_by rel<Usuario>

## Requerimientos técnicos

Crear una API con nodeJS y Typescript, usando el framework Express, patrón MVC y vistas en handlebars con bootstrap.