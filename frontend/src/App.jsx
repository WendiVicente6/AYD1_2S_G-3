import { useState, useEffect } from 'react';

function App() {
  const [mensajeBackend, setMensajeBackend] = useState('Cargando...');
  const [tareas, setTareas] = useState([]);

  useEffect(() => {
    // 1. Validar conexión con el Backend
    fetch('http://localhost:5000/api/health')
      .then(res => res.json())
      .then(data => setMensajeBackend(data.message))
      .catch(err => setMensajeBackend('Error al conectar con Flask ❌'));

    // 2. Traer la lista de tareas simuladas
    fetch('http://localhost:5000/api/tareas')
      .then(res => res.json())
      .then(data => setTareas(data))
      .catch(err => console.error("Error cargando tareas:", err));
  }, []);

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Proyecto React + Flask 🚀</h1>
      
      {/* Estado de la conexión */}
      <p><strong>Estado del Backend:</strong> {mensajeBackend}</p>

      <hr />

      <h2>Lista de tareas desde la API:</h2>
      <ul>
        {tareas.map(tarea => (
          <li key={tarea.id} style={{ textDecoration: tarea.completada ? 'line-through' : 'none' }}>
            {tarea.titulo}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
