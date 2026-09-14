import os
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


def _get_smtp_config():
    host = os.getenv("EMAIL_HOST", "smtp.gmail.com")
    port = int(os.getenv("EMAIL_PORT", "587"))
    user = os.getenv("EMAIL_USER")
    app_password = os.getenv("EMAIL_APP_PASSWORD")

    if not user or not app_password:
        raise RuntimeError(
            "Credenciales de correo no configuradas. "
            "Define EMAIL_USER y EMAIL_APP_PASSWORD en el .env."
        )

    return host, port, user, app_password


def _enviar(destinatario, asunto, cuerpo):
    host, port, user, app_password = _get_smtp_config()

    mensaje = MIMEMultipart()
    mensaje["From"] = user
    mensaje["To"] = destinatario
    mensaje["Subject"] = asunto
    mensaje.attach(MIMEText(cuerpo, "plain"))

    contexto = ssl.create_default_context()
    with smtplib.SMTP(host, port) as server:
        server.starttls(context=contexto)
        server.login(user, app_password)
        server.sendmail(user, destinatario, mensaje.as_string())


def send_cancelacion_email(destinatario, nombre_estudiante, fecha, hora_inicio, hora_final, motivo, nombre_tutor, materia):
    asunto = f"Tu sesión de tutoría de {materia} fue cancelada"
    cuerpo = (
        f"Hola {nombre_estudiante},\n\n"
        f"Lamentamos informarte que tu sesión de tutoría fue cancelada por el tutor: {nombre_tutor}.\n\n"
        "Detalles de la sesión cancelada:\n"
        f"  Materia: {materia}\n"
        f"  Fecha: {fecha.strftime('%d/%m/%Y')}\n"
        f"  Hora: {hora_inicio.strftime('%H:%M')} - {hora_final.strftime('%H:%M')}\n"
        f"  Motivo: {motivo}\n\n"
        "Disculpa las molestias que esto pueda ocasionarte. Te invitamos a programar una nueva sesión "
        "cuando gustes desde la plataforma.\n\n"
        "— Equipo EduConnect"
    )
    _enviar(destinatario, asunto, cuerpo)
