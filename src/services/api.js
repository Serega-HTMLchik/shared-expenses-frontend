const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

export async function api(path, { token, method = "GET", body, formData } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body && !formData ? { "Content-Type": "application/json" } : {}),
    },
    body: formData || (body ? JSON.stringify(body) : undefined),
  });
  const data = response.status === 204 ? null : await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Не удалось выполнить запрос");
  }

  return data;
}
