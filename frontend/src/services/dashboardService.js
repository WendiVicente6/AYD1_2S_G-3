import { apiRequest } from "./api";

export async function getDashboard() {
  return await apiRequest("/admin/dashboard");
}