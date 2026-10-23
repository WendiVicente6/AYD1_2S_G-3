import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";
import Topbar from "../components/Topbar/Topbar";

export default function DashboardLayout() {
  return (
    <div data-testid="dashboard" className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Topbar />
        <div className="page-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
