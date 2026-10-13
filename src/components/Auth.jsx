import { useState } from "react";
import { Paid } from "@mui/icons-material";
import { Alert, Avatar, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { api } from "../services/api";

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    device_name: "Web app",
  });
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();

    try {
      onAuth(await api(`/${mode}`, { method: "POST", body: form }));
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const updateField = (field) => (event) =>
    setForm({ ...form, [field]: event.target.value });

  return (
    <Box className="auth-page">
      <Paper elevation={0} className="auth-card">
        <Stack spacing={3}>
          <Box>
            <Avatar className="brand-avatar">
              <Paid />
            </Avatar>
            <Typography variant="h4">Делим вместе</Typography>
            <Typography color="text.secondary">Совместные расходы без путаницы.</Typography>
          </Box>
          {error && <Alert severity="error">{error}</Alert>}
          <Box component="form" onSubmit={submit}>
            <Stack spacing={2}>
              {mode === "register" && (
                <TextField label="Имя" required onChange={updateField("name")} />
              )}
              <TextField label="Email" type="email" required onChange={updateField("email")} />
              <TextField label="Пароль" type="password" required onChange={updateField("password")} />
              {mode === "register" && (
                <TextField
                  label="Повторите пароль"
                  type="password"
                  required
                  onChange={updateField("password_confirmation")}
                />
              )}
              <Button type="submit" variant="contained" size="large">
                {mode === "login" ? "Войти" : "Создать аккаунт"}
              </Button>
            </Stack>
          </Box>
          <Button onClick={() => setMode(mode === "login" ? "register" : "login")}>
            {mode === "login" ? "Зарегистрироваться" : "Войти"}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
