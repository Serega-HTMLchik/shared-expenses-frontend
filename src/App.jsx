import { useState } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import "./App.css";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import { api } from "./services/api";
import { theme } from "./theme";

export default function App() {
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("shared-expenses-session"));
    } catch {
      return null;
    }
  });

  const auth = (data) => {
    localStorage.setItem("shared-expenses-session", JSON.stringify(data));
    setSession(data);
  };

  const logout = async () => {
    try {
      await api("/logout", { token: session.token, method: "POST" });
    } catch {
      // Локальный токен удаляется, даже если сервер недоступен.
    }

    localStorage.removeItem("shared-expenses-session");
    setSession(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {session ? <Dashboard session={session} logout={logout} /> : <Auth onAuth={auth} />}
    </ThemeProvider>
  );
}
