import { apiRequest } from "./api";
const TOKEN_KEY = "educonnect_token";
const USER_KEY = "educonnect_user";

export async function login(correo, password) {
  const data = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({correo, password}),
  });
  sessionStorage.setItem(TOKEN_KEY, data.token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data.user;
}
export function logout() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}
export function getToken() { return sessionStorage.getItem(TOKEN_KEY); }
export function getStoredUser() {
  const value = sessionStorage.getItem(USER_KEY);
  return value ? JSON.parse(value) : null;
}
export async function getMe() {
  const token = getToken();
  if (!token) return null;
  const data = await apiRequest("/auth/me", {headers: {Authorization: `Bearer ${token}`}});
  sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data.user;
}
