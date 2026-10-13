import Echo from "laravel-echo";
import Pusher from "pusher-js";

const API_ORIGIN = "http://127.0.0.1:8000";

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
