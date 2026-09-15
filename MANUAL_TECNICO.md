# Manual Técnico

**Proyecto:** EduConnect — Plataforma de Gestión de Tutorías Académicas
**Curso:** Análisis y Diseño de Sistemas 1 — Segundo Semestre 2026

---

## 1. Descripción general

EduConnect es una plataforma web que digitaliza la gestión de tutorías académicas entre estudiantes y tutores, con un módulo administrativo de supervisión. El sistema implementa tres roles diferenciados —**Estudiante**, **Tutor** y **Administrador**— cada uno con su propio flujo de autenticación y funcionalidades.

## 2. Arquitectura

```
Frontend (React + Vite, puerto 5173)
        │  HTTP / JSON
        ▼
Backend (Flask, puerto 5000)
        │  psycopg (driver PostgreSQL)
        ▼
Base de datos PostgreSQL (EduConnect)
```

El backend está organizado en **blueprints de Flask** por área funcional, todos registrados bajo el prefijo `/api` en `app.py`:

| Blueprint | Archivo | Responsabilidad |
|---|---|---|
| `auth_bp` | `routes/auth.py` | Login de los tres roles y verificación de sesión |
| `auth2_bp` | `routes/auth2.py` | Segunda autenticación del administrador |
| `registration_bp` | `routes/registration.py` | Registro de estudiantes y tutores |
| `dashboard_bp` | `routes/dashboard.py` | Datos iniciales de cada dashboard |
| `schedule_bp` | `routes/schedule.py` | Horario de atención del tutor |
| `sessions_bp` | `routes/sessions.py` | Programación, consulta y cancelación de sesiones |
| `students_bp` | `routes/students.py` | Vista del estudiante: tutores disponibles y su horario |
| `tutor_sessions_bp` | `routes/tutor.py` | Historial, dashboard y perfil del tutor |
| `admin_bp` | `routes/adminstudent.py` | Aprobación de estudiantes por parte del administrador |

La **autenticación** se maneja con **JWT**: al iniciar sesión, el backend genera un token con el `id_usuario` y el rol (`student`, `tutor` o `admin`), que el frontend guarda en `sessionStorage` y reenvía en cada petición protegida mediante la cabecera `Authorization: Bearer <token>`. Cada endpoint valida tanto la identidad como los permisos del solicitante antes de ejecutar la operación.

Las **contraseñas** se almacenan encriptadas con el esquema de hashing de Werkzeug (`generate_password_hash` / `check_password_hash`).

## 3. Instalación y configuración

### 3.1 Requisitos
- Python 3.12+
- Node.js 18+
- PostgreSQL 16

### 3.2 Base de datos
1. Crear la base `EduConnect` en PostgreSQL.
2. Ejecutar en orden los scripts de `Backend/BD/`:
   `01_Inicializacion_BD_postgreSQL.sql` (esquema), `02_datos_iniciales_BD.sql` (catálogos), `03_Insert_Into_admin.sql` (usuario administrador inicial).

### 3.3 Backend
```powershell
cd Backend
python -m venv venv
venv\Scripts\activate
pip install flask flask-cors "psycopg[binary]" pyjwt python-dotenv werkzeug
```

Variables de entorno (`Backend/.env`, no se sube al repositorio):
```
DATABASE_URL=postgresql://usuario:password@localhost:5432/EduConnect
JWT_SECRET_KEY=<clave-secreta>
FRONTEND_URL=http://localhost:5173
AUTH2_SECRET=<clave-segunda-autenticacion-admin>

# Notificaciones por correo (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=<correo-remitente>
EMAIL_APP_PASSWORD=<contraseña-de-aplicación>
```

Levantar el servidor:
```powershell
python app.py
```
Verificación: `GET http://localhost:5000/api/health` debe responder `{"status": "ok"}`.

### 3.4 Frontend
```powershell
cd frontend
npm install
npm run dev
```
La aplicación queda disponible en `http://localhost:5173`.

## 4. Modelo de datos

Tablas principales del esquema relacional:

| Tabla | Contenido |
|---|---|
| `trol`, `testado_usr`, `testado_sesion` | Catálogos de roles y estados |
| `tusuario` | Datos comunes de estudiantes, tutores y administrador |
| `ttutor` | Datos específicos del tutor (número de identificación, dirección de tutoría, universidad, año de inicio) |
| `tmateria` | Materias disponibles |
| `ttutor_materia` | Relación N:M entre tutores y las materias que imparten |
| `thorario_atencion` / `thorario_dia` | Horario general del tutor y los días de la semana en que atiende |
| `tsesion` | Sesiones programadas, con estado, fecha, horario, motivo, resumen y quién la canceló |

Reglas de negocio relevantes implementadas a nivel de consulta:

- **Disponibilidad por fecha:** se generan bloques de 60 minutos entre `hora_inicio` y `hora_fin` del horario del tutor, marcando como *ocupado* el bloque que se traslapa con una sesión que no esté en estado *Cancelada*.
- **Exclusión de tutores con sesión activa:** la lista de tutores disponibles del estudiante excluye a aquellos con los que ya tiene una sesión en estado *Pendiente* o *Confirmada*.
- **Trazabilidad de cancelación:** `tsesion.id_usuario_cancelacion` guarda el id de quien canceló (clave foránea a `tusuario`, restringida por `CHECK` a que solo pueda ser el tutor o el estudiante de esa misma sesión), lo que permite distinguir de forma confiable si la canceló el tutor o el estudiante sin depender solo de un texto libre.
- **Convención de días:** toda la aplicación usa el estándar ISO (1 = lunes … 7 = domingo), tanto en el backend (`EXTRACT(ISODOW ...)` en SQL / `date.isoweekday()` en Python) como en el frontend.

## 5. Referencia de endpoints

Todas las rutas están bajo el prefijo `/api`. Salvo que se indique "Pública", requieren la cabecera `Authorization: Bearer <token>`.

### 5.1 Autenticación y registro

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | `/auth/login` | Pública | Login de estudiante, tutor o administrador (correo + contraseña) |
| GET | `/auth/me` | Autenticado | Datos del usuario del token actual |
| POST | `/auth2` | Pública | Segunda autenticación del administrador (archivo `auth2-ayd1.txt`) |
| POST | `/students` | Pública | Registro de un nuevo estudiante (queda pendiente de aprobación) |
| POST | `/tutors` | Pública | Registro de un nuevo tutor (queda pendiente de aprobación) |

### 5.2 Módulo Estudiante

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/estudiante/tutores` | Lista de tutores aprobados, excluyendo los que ya tienen sesión activa con el estudiante |
| GET | `/estudiante/tutores/<id>/horario` | Días de atención y rango de horas de un tutor |
| GET | `/estudiante/tutores/<id>/disponibilidad?fecha=YYYY-MM-DD` | Bloques disponibles/ocupados del tutor en una fecha específica |
| GET | `/materias` | Lista de materias registradas |
| GET | `/tutores?id_materia=` | Tutores que imparten una materia (para programar sesión) |
| POST | `/sesiones` | Programa una sesión, validando horario del tutor y ausencia de traslapes |
| GET | `/sesiones/activas` | Sesiones Pendientes/Confirmadas del estudiante |
| PUT | `/sesiones/<id_sesion>/cancelar` | Cancela una sesión propia del estudiante y libera el horario |

### 5.3 Módulo Tutor

| Método | Ruta | Descripción |
|---|---|---|
| GET / POST / PUT | `/tutors/schedule` | Consultar, crear y actualizar el horario de atención |
| GET | `/tutors/sessions/pending` | Sesiones pendientes por atender, ordenadas por fecha |
| PUT | `/tutors/sessions/<id>/confirm` | Confirma una sesión pendiente |
| PUT | `/tutors/sessions/<id>/attend` | Marca una sesión como atendida y guarda el resumen |
| PUT | `/tutors/sessions/<id>/cancel` | Cancela una sesión y notifica al estudiante por correo |
| GET | `/tutor/historial` | Historial de sesiones atendidas y canceladas del tutor |
| GET | `/tutor/dashboard` | Estadísticas del dashboard del tutor (sesiones pendientes, estudiantes atendidos) |
| GET / PUT | `/tutor/perfil` | Consultar y actualizar el perfil profesional del tutor |

### 5.4 Módulo Administrador

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/admin/estudiantes-pendientes` | Lista de estudiantes pendientes de aprobación |
| PATCH | `/admin/estudiantes/<id>/aprobar` | Aprueba a un estudiante pendiente |
| PATCH | `/admin/estudiantes/<id>/rechazar` | Rechaza a un estudiante pendiente |

### 5.5 General

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/dashboard/<role>` | Datos iniciales del dashboard según el rol (admin/student/tutor) |
| GET | `/health` | Verifica que el backend esté corriendo |

## 6. Estructura del frontend

| Carpeta / Componente | Responsabilidad |
|---|---|
| `pages/Login`, `pages/Auth2` | Inicio de sesión y segunda autenticación del administrador |
| `pages/Registros` | Formularios de registro de estudiante y tutor |
| `pages/Dashboard` | Dashboards por rol (Admin, Tutor, Student) |
| `pages/Tutores` | Vista de tutores disponibles, horario/disponibilidad, historial y perfil del tutor |
| `pages/Sesiones` | Programar sesión, sesiones activas del estudiante, sesiones pendientes del tutor |
| `pages/Horarios` | Configuración del horario de atención del tutor |
| `pages/Estudiantes` | Aprobación de estudiantes (vista del administrador) |
| `pages/context/AuthContext.jsx` | Estado global de sesión (usuario, token, login/logout) |
| `components/ProtectedRoute` | Restringe el acceso a rutas según el rol autenticado |
| `services/*.js` | Un archivo por área, encapsula las llamadas `fetch` a cada grupo de endpoints |

## 7. Decisiones técnicas

### 7.1 Elección del stack tecnológico

**Frontend — React + Vite.** Se eligió React porque permite construir la interfaz como componentes reutilizables (tarjetas de tutor, formularios, modales de confirmación, etc.) y porque maneja bien el estado de una aplicación con varias vistas por rol sin tener que recargar la página. Vite se usó como herramienta de build en lugar de opciones más antiguas porque el tiempo de recarga en desarrollo es casi inmediato y la configuración inicial es mínima, lo cual ayudó a que el equipo avanzara rápido durante los sprints.

**Backend — Flask (Python).** Se optó por Flask por ser un microframework: no impone una estructura fija, lo que permitió organizar el backend en blueprints (un archivo por módulo — autenticación, sesiones, horarios, tutores, administración) y que cada integrante trabajara en el suyo con poco riesgo de pisar el código de otro. Además, la curva de aprendizaje es más corta que la de un framework más grande como Django, lo cual era importante dado el tiempo limitado del proyecto.

**Base de datos — PostgreSQL.** El problema del proyecto (estudiantes, tutores, materias, horarios y sesiones) tiene relaciones claras entre entidades, así que una base de datos relacional encajaba mejor que una NoSQL. PostgreSQL además permite definir restricciones a nivel de esquema (llaves foráneas, `CHECK`) que ayudan a mantener la información consistente — por ejemplo, que una sesión no pueda cancelarse por un usuario que no sea ni el tutor ni el estudiante de esa sesión.

**Autenticación — JWT.** Se usó JSON Web Tokens porque el backend no necesita guardar sesiones activas en memoria ni en base de datos: el token ya lleva codificado quién es el usuario y su rol, firmado con una clave secreta, y cada endpoint puede validarlo por su cuenta.

**Encriptación de contraseñas — Werkzeug.** Al ser parte de las dependencias que ya trae Flask, no fue necesario agregar una librería externa. Usa algoritmos de hashing lentos a propósito (scrypt/pbkdf2), pensados para dificultar ataques de fuerza bruta si la base de datos llegara a filtrarse.

**Notificaciones — SMTP con Gmail.** Se eligió sobre alternativas como SendGrid o Mailgun porque no requiere dar de alta una cuenta empresarial ni verificar un dominio propio: con una cuenta de Gmail y una contraseña de aplicación ya es posible enviar correos reales, lo cual era suficiente para las necesidades del proyecto.

**Control de versiones — Git + GitHub con Git Flow.** Con varios integrantes trabajando en paralelo, tener una rama por historia de usuario (`feature/nombre_carnet`) permitió que cada quien avanzara sin afectar el trabajo de los demás hasta que su parte estuviera lista para revisarse y fusionarse a `develop`.

**Gestión de tareas — Trello.** Se usó por ser gratuito, simple de configurar entre todos los integrantes, y suficiente para el tamaño del equipo y del proyecto, con las columnas que pedía la rúbrica del curso (To Do, Blocked, In Progress, Test/QA, Deploy).

### 7.2 Decisiones de implementación

- **Blueprints por área funcional:** cada módulo del enunciado (autenticación, sesiones, horarios, tutores, administración) vive en su propio archivo de rutas, lo que facilita que distintos integrantes trabajen en paralelo sin pisarse el código.
- **JWT sin sesiones de servidor:** al no mantener estado en el backend, cualquier instancia del servidor puede validar un token por su cuenta, y el rol va codificado en el propio token para autorizar cada endpoint.
- **Bloques de disponibilidad de 60 minutos:** es la duración estándar de una sesión de tutoría en el sistema; se define como constante para poder ajustarse en un solo lugar si cambiara.
- **`id_usuario_cancelacion` como clave foránea en lugar de solo texto:** permite construir de forma confiable vistas como el historial de sesiones, que necesitan distinguir si la cancelación fue hecha por el estudiante o por el tutor, en vez de depender de comparar cadenas de texto.
- **Confirmaciones mediante modales propios en vez de la alerta nativa del navegador:** cumple con el principio de prevención de errores de Nielsen sin depender del diálogo `confirm()` del navegador, que no se puede personalizar visualmente ni mantiene la identidad visual del sistema.
- **Notificación de cancelación por correo mediante SMTP (Gmail + contraseña de aplicación):** opción simple de configurar para un entorno académico, sin depender de dar de alta una cuenta en un proveedor externo como SendGrid.
- **Manejo explícito de estados de carga, error y vacío en cada vista:** aporta al principio de visibilidad del estado del sistema — el usuario siempre sabe si la aplicación está procesando, si algo falló, o si simplemente no hay datos que mostrar.

## 8. Manejo de errores

El backend responde siempre en formato `{"ok": boolean, "message": string, ...}`. El frontend interpreta ese contrato para mostrar mensajes específicos (credenciales inválidas, sesión ya cancelada, tutor sin horario configurado, carnet duplicado, etc.) en lugar de errores genéricos, y distingue los códigos de estado HTTP relevantes: `400` (datos inválidos), `401` (no autenticado), `403` (sin permisos), `404` (recurso no encontrado), `409` (conflicto, por ejemplo un horario ya ocupado) y `500` (error interno).
