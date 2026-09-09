import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login/Login";
import AdminDashboard from "./pages/Dashboard/AdminDashboard";
import TutorDashboard from "./pages/Dashboard/TutorDashboard";
import StudentDashboard from "./pages/Dashboard/StudentDashboard";
import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Placeholder from "./pages/Placeholder/Placeholder";
import RegisterStudent from "./pages/Registros/RegisterStudent";
import RegisterTutor from "./pages/Registros/RegisterTutor";
import SetSchedule from "./pages/Horarios/SetSchedule";
import ProgramarSesion from "./pages/Sesiones/ProgramarSesion";
import SesionesActivas from "./pages/Sesiones/SesionesActivas";
import PendingSessions from "./pages/Sesiones/PendingSessions";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<DashboardLayout />}>

        <Route
          path="/admin/dashboard"
          element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>}
        />
        <Route
          path="/student/dashboard"
          element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>}
        />

        <Route
          path="/student/programar-sesion"
          element={<ProtectedRoute role="student"><ProgramarSesion /></ProtectedRoute>}
        />

        <Route
          path="/student/mis-sesiones"
          element={<ProtectedRoute role="student"><SesionesActivas /></ProtectedRoute>}
        />

        <Route
          path="/tutor/dashboard"
          element={<ProtectedRoute role="tutor"><TutorDashboard /></ProtectedRoute>}
        />
        <Route
          path="/tutor/schedule"
          element={<ProtectedRoute role="tutor"><SetSchedule /></ProtectedRoute>}
        />

        <Route
          path="/students"
          element={<ProtectedRoute role="admin"><Placeholder title="Estudiantes" description="Gestión y consulta de estudiantes." /></ProtectedRoute>}
        />
        <Route
          path="/tutors"
          element={<ProtectedRoute role="admin"><Placeholder title="Tutores" description="Gestión y consulta de tutores." /></ProtectedRoute>}
        />
        <Route
          path="/sessions"
          element={<ProtectedRoute role="tutor"><PendingSessions /></ProtectedRoute>}
        />
        <Route
          path="/reports"
          element={<ProtectedRoute role="admin"><Placeholder title="Reportes" description="Reportes administrativos del sistema." /></ProtectedRoute>}
        />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
      <Route
        path="/register/student"
        element={<RegisterStudent />}
      />
      <Route
        path="/register/tutor"
        element={<RegisterTutor />}
      />
    </Routes>
  );
}