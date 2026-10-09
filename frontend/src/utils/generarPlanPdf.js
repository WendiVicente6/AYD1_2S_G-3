import jsPDF from "jspdf";
import "jspdf-autotable";

// Teléfono de contacto que se muestra en el encabezado del PDF (HU-033, criterio 1).
// Si la plataforma tiene un número oficial distinto, solo cámbialo aquí.
const TELEFONO_CONTACTO = "PBX 2418-8000";

function formatearFechaLarga(fechaISO) {
  if (!fechaISO) return "—";
  const [anio, mes, dia] = fechaISO.split("-");
  return `${dia}/${mes}/${anio}`;
}

/**
 * Genera y descarga un PDF con el plan de estudio del estudiante.
 * @param {object} plan - el mismo objeto que devuelve getPlanEstudio(idSesion)
 */
export function generarPlanPdf(plan) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margenIzq = 40;
  let y = 50;

  // ===== Encabezado =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(30, 64, 175); // azul EduConnect
  doc.text("EduConnect", margenIzq, y);

  const fechaEmision = new Date().toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`Fecha de emisión: ${fechaEmision}`, pageWidth - margenIzq, y - 14, { align: "right" });
  doc.text(`Teléfono de contacto: ${TELEFONO_CONTACTO}`, pageWidth - margenIzq, y, { align: "right" });

  y += 10;
  doc.setDrawColor(220, 220, 220);
  doc.line(margenIzq, y, pageWidth - margenIzq, y);
  y += 30;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(20, 20, 20);
  doc.text("Constancia de plan de estudio", margenIzq, y);
  y += 28;

  // ===== Datos generales de la sesión =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text("FECHA DE LA ÚLTIMA SESIÓN", margenIzq, y);
  doc.text("TUTOR", margenIzq + 260, y);
  y += 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  doc.text(formatearFechaLarga(plan.fecha_ultima_sesion), margenIzq, y);
  doc.text(plan.tutor_nombre || "—", margenIzq + 260, y);
  y += 26;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text("DIFICULTADES IDENTIFICADAS", margenIzq, y);
  y += 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  const dificultades = plan.dificultades || "El tutor no registró dificultades para esta sesión.";
  const lineasDificultades = doc.splitTextToSize(dificultades, pageWidth - margenIzq * 2);
  doc.text(lineasDificultades, margenIzq, y);
  y += lineasDificultades.length * 14 + 20;

  // ===== Cuerpo: tabla de recursos recomendados =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Recursos recomendados", margenIzq, y);
  y += 10;

  const filas = (plan.recursos && plan.recursos.length > 0)
    ? plan.recursos.map((r) => [r.nombre_recurso, r.tipo_recurso, r.descripcion_uso])
    : [["—", "—", "El tutor no registró recursos para esta sesión."]];

  doc.autoTable({
    startY: y + 10,
    margin: { left: margenIzq, right: margenIzq },
    head: [["Nombre del recurso", "Tipo", "Descripción de uso"]],
    body: filas,
    styles: { fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor: [30, 64, 175], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  // ===== Pie: firma/sello del tutor =====
  const finalY = doc.lastAutoTable.finalY + 50;
  const pageHeight = doc.internal.pageSize.getHeight();
  const yFirma = Math.max(finalY, pageHeight - 140);

  doc.setDrawColor(150, 150, 150);
  doc.line(margenIzq, yFirma, margenIzq + 220, yFirma);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  doc.text(plan.tutor_nombre || "—", margenIzq, yFirma + 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`Especialidad: ${plan.tutor_especialidad || "—"}`, margenIzq, yFirma + 32);
  doc.text(`No. de identificación: ${plan.tutor_nro_id || "—"}`, margenIzq, yFirma + 46);

  const nombreArchivo = `plan-estudio-sesion-${plan.id_plan || "estudiante"}.pdf`;
  doc.save(nombreArchivo);
}
