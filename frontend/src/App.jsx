import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard/Dashboard";
import Login from "./pages/Login/Login";
import Placeholder from "./pages/Placeholder/Placeholder";
import Auth2 from "./pages/Auth2/Auth2";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth2" element={<Auth2 />} />

      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/students" element={<Placeholder title="Estudiantes" description="Gestión y consulta de estudiantes." />} />
        <Route path="/tutors" element={<Placeholder title="Tutores" description="Gestión y consulta de tutores." />} />
        <Route path="/sessions" element={<Placeholder title="Sesiones" description="Gestión de sesiones de tutoría." />} />
        <Route path="/reports" element={<Placeholder title="Reportes" description="Reportes administrativos del sistema." />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
