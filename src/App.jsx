import { useState } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { Navigate, Route, Routes } from "react-router-dom";
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
      {session ? (
        <Routes>
          <Route path="/" element={<Dashboard session={session} logout={logout} />} />
          <Route path="/balances" element={<Dashboard session={session} logout={logout} />} />
          <Route path="/groups/:groupId" element={<Dashboard session={session} logout={logout} />} />
          <Route path="/invitations/:token" element={<Dashboard session={session} logout={logout} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      ) : (
        <Routes>
          <Route path="*" element={<Auth onAuth={auth} />} />
        </Routes>
      )}
    </ThemeProvider>
  );
}
