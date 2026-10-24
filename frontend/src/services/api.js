
const apiUrlPrueba = new URLSearchParams(
  window.location.search
).get("apiUrl");

export const API_URL =
  apiUrlPrueba ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

export async function apiRequest(path, options = {}) {
  const token = sessionStorage.getItem("educonnect_token");

  const headers = {
    ...(options.body instanceof FormData
      ? {}
      : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data.message ||
        data.error ||
        `Ocurrió un error (${response.status}).`
    );

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
}
