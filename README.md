**Materia:** Tecnologías Web I
**Profesor:** M.T.I.E. Irving Ulises Hernández Miguel
**Ciclo:** 2025-2026 B
# 🛠️ Ctrl + Mat — Sistema de Control de Vales e Inventario

> ** NOTA ** El enlace al video de demostración y explicación del código  se encuentra disponible haciendo clic en el botón superior o a través del siguiente enlace directo: https://drive.google.com/file/d/1NL6fw4zXF6HgZYsbE7BxZAagJJ0-Hfa6/view?usp=sharing .

---

## 📝 Descripción del Proyecto
**Ctrl + Mat** es una plataforma web diseñada para la gestión, automatización y monitoreo de préstamos de materiales y herramientas en los laboratorios de la **Universidad de la Sierra Sur (UNSIS)**. El sistema optimiza el flujo tradicional de solicitud de materiales, transformándolo en un proceso digital centralizado y eficiente que cuenta con control de stock en tiempo real y detección automática de retrasos para los estudiantes.

---

##  Arquitectura del Sistema
El sistema se construyó bajo un enfoque descentralizado utilizando una arquitectura de cliente-servidor, comunicándose mediante peticiones HTTP asíncronas:

* **Client / Frontend (Capa de Presentación):** Una interfaz SPA ligera que se comunica con el servidor de manera asíncrona mediante la API nativa `fetch` de JavaScript. Maneja la persistencia de estados de sesión mediante `localStorage`.
* **Server / Backend (Capa de Lógica de Negocio):** Servidor HTTP RESTful estructurado sobre Node.js que procesa las reglas del negocio, valida la existencia de inventarios y manipula los estados lógicos de los vales.
* **Database (Capa de Persistencia de Datos):** Base de datos relacional robusta con restricciones de integridad relacional, llaves primarias/foráneas y un esquema completamente normalizado.

---

## 💻 Tecnologías y Versiones Utilizadas
* **Frontend:**
  * HTML5 / JavaScript Moderno (ECMAScript 6+, Async/Await)
  * [Tailwind CSS v3.x](https://tailwindcss.com/) (Framework de Estilos vía CDN)
* **Backend:**
  * [Node.js](https://nodejs.org/)
  * Express (Framework de Servidor HTTP)
  * CORS (Middleware de Seguridad para Intercambio de Recursos)
  * Dotenv (Administrador de Variables de Entorno)
* **Base de Datos:**
  * [MariaDB]
  * Driver `mysql2` (Conector nativo con soporte de promesas para Node.js)

---

##  Endpoints Principales de la API (Documentación de Rutas)

### Módulo de Autenticación
* `POST /api/login` -> Valida credenciales de acceso del usuario (matrícula y contraseña) y retorna su rol (`alumno` / `administrador`).

###  Módulo de Materiales (Inventario)
* `GET /api/materiales` -> Obtiene la lista completa de materiales registrados con sus descripciones y stock disponible.
* `POST /api/materiales` -> Registra un nuevo artículo en el almacén (Exclusivo Administrador).

### Módulo de Préstamos y Vales
* `POST /api/prestamos` -> Crea un nuevo vale dinámico multi-artículo en estado `pendiente`.
* `GET /api/prestamos/pendientes` -> Lista las solicitudes que esperan aprobación.
* `POST /api/prestamos/accion` -> Aprueba (descuenta stock disponible) o rechaza un vale.
* `GET /api/prestamos/activos` -> Muestra los materiales que se encuentran físicamente fuera del laboratorio.
* `POST /api/prestamos/devolver` -> Recibe el material devuelto por el alumno e incrementa el stock nuevamente.
* `GET /api/prestamos/concluidos` -> Historial cronológico general de vales cerrados con éxito.
* `GET /api/prestamos/alumno/:matricula` -> Historial individual de un alumno. Modifica dinámicamente el estado a `retrasado` al vuelo si `fecha_entrega_estimada < CURDATE()`.

---

## 🛠️ Instrucciones de Instalación y Ejecución

### 1. Clonar o Estructurar el Proyecto
Asegúrate de tener la siguiente distribución de archivos en tu entorno local:
```text
├── backend/
│   ├── db.js               # Conexión al Pool de MariaDB
│   ├── server.js           # Servidor Express y endpoints de la API
│   └── .env                # Variables de entorno configurables
├── frontend/
│   ├── login.html          # Control de acceso principal
│   ├── index.html          # Panel principal del estudiante
│   ├── formulario.html     # Generación de vales con catálogo predictivo
│   └── administrador.html  # Panel de administración e inventarios
└── README.md               # Documentación del Repositorio
