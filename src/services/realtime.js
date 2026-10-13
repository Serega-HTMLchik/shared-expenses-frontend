import Echo from "laravel-echo";
import Pusher from "pusher-js";

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1";
const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN ||
  new URL(apiBaseUrl, window.location.origin).origin;

export function subscribeToChanges({ token, userId, onChange }) {
  if (!import.meta.env.VITE_REVERB_APP_KEY) {
    return () => {};
  }

  window.Pusher = Pusher;

  const scheme = import.meta.env.VITE_REVERB_SCHEME || "http";
  const port = Number(import.meta.env.VITE_REVERB_PORT || 8080);
  const echo = new Echo({
    broadcaster: "reverb",
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
    wsPort: port,
    wssPort: port,
    forceTLS: scheme === "https",
    enabledTransports: ["ws", "wss"],
    authEndpoint: `${API_ORIGIN}/api/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
  const channelName = `users.${userId}`;

  echo
    .private(channelName)
    .listen(".shared-expenses.changed", onChange)
    .listen(".shared-expenses.notifications.changed", onChange);

  return () => {
    echo.leave(channelName);
    echo.disconnect();
  };
}
