const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function post(path, data) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.message || "Ocurrió un error al procesar la solicitud."
    );
  }

  return result;
}

// Registro de estudiante: envía texto y archivos usando FormData.
export async function registerStudent(data) {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      formData.append(key, value);
    }
  });

  const response = await fetch(`${API_URL}/students`, {
    method: "POST",
    body: formData,
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.message || "No fue posible registrar al estudiante."
    );
  }

  return result;
}

// Función auxiliar para convertir el archivo PDF físico a una cadena Base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // El resultado es: "data:application/pdf;base64,JVBERi..."
      // Separamos el encabezado para quedarnos únicamente con la cadena base64 pura
      const base64String = reader.result.split(",")[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};

// Registro de tutores: envía un JSON puro manteniendo intactas tus listas y objetos nativos
export async function registerTutor(data) {
  let pdfBase64 = null;

  // Convertimos el PDF físico a Base64 únicamente si el archivo existe
  if (data.cv_pdf) {
    try {
      pdfBase64 = await fileToBase64(data.cv_pdf);
    } catch (err) {
      throw new Error("No se pudo procesar el archivo PDF del currículum.");
    }
  }

  // Creamos el payload estructurado asegurando que las llaves obligatorias existan siempre
  const payload = {
    nombres: data.nombres,
    apellidos: data.apellidos,
    carnet: data.carnet,
    genero: data.genero,
    direccion: data.direccion,
    telefono: data.telefono || "", // Enviamos string vacío en lugar de eliminar la propiedad
    fec_nac: data.fec_nac,
    correo: data.correo,
    password: data.password,
    foto: data.foto || "", 
    
    // Propiedades exclusivas del tutor
    nro_id: data.nro_id,
    dir_tutoria: data.dir_tutoria,
    anio_inicio_tutoria: data.anio_inicio_tutoria,
    u_graduacion: data.u_graduacion,
    
    // MANTIENE TU LÓGICA: Pasa la lista original sin alteraciones de formato
    materias: data.materias || [], 

    // Mapeamos el PDF transformado en texto plano junto a su metadato
    cv_pdf: pdfBase64,
    cv_pdf_nombre: data.cv_pdf?.name || "curriculum.pdf"
  };

  // Hacemos el envío tradicional mediante un Content-Type: application/json
  const response = await fetch(`${API_URL}/tutors`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json" 
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.message || "No fue posible registrar al tutor."
    );
  }

  return result;
}
